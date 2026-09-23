"""Public guest endpoints — zero login: browse clients, open a photo gallery."""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from lib.db import db
from lib.sync import sync_client_photos
from models.clients import (
    Client,
    ClientDetail,
    ClientSummary,
    Photo,
    cover_for,
    to_photo_out,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/clients", tags=["clients"])

STALE_AFTER_SECONDS = 45  # a guest opening the gallery re-reads Drive if the cache is older than this


def _with_tz(dt: datetime | None) -> datetime | None:
    """Motor returns naive datetimes — normalise to aware UTC before use/serialising."""
    return dt.replace(tzinfo=timezone.utc) if dt and dt.tzinfo is None else dt


async def _load_photos(client_id: str) -> list[Photo]:
    docs = await db.photos.find({"client_id": client_id}).sort(
        [("position", 1), ("name", 1)]
    ).to_list(5000)
    return [Photo(**d) for d in docs]


@router.get("", response_model=list[ClientSummary])
async def list_clients():
    clients = [
        Client(**d)
        for d in await db.clients.find().sort([("sort_order", 1), ("name", 1)]).to_list(500)
    ]
    grouped: dict[str, list[Photo]] = {}
    async for d in db.photos.find(
        {}, {"client_id": 1, "url": 1, "drive_file_id": 1, "name": 1, "position": 1}
    ).sort([("client_id", 1), ("position", 1)]):
        p = Photo(**d)
        grouped.setdefault(p.client_id, []).append(p)
    return [
        ClientSummary(
            id=c.id,
            name=c.name,
            event_date=c.event_date,
            venue=c.venue,
            cover=cover_for(c, grouped.get(c.id, [])),
            photo_count=len(grouped.get(c.id, [])),
        )
        for c in clients
    ]


@router.get("/{client_id}", response_model=ClientDetail)
async def get_client(client_id: str):
    doc = await db.clients.find_one({"id": client_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Galeri tidak ditemukan")
    client = Client(**doc)
    photos = await _load_photos(client.id)

    if client.drive_folder_id:
        synced = _with_tz(client.synced_at)
        stale = synced is None or (
            datetime.now(timezone.utc) - synced
        ).total_seconds() > STALE_AFTER_SECONDS
        if not photos or stale:
            try:
                await sync_client_photos(client)
                photos = await _load_photos(client.id)
                client.synced_at = datetime.now(timezone.utc)
            except Exception as exc:  # degrade to the cached copy — a guest visit must never 500
                logger.warning("drive sync failed for %s: %s", client.drive_folder_id, exc)

    return ClientDetail(
        id=client.id,
        name=client.name,
        event_date=client.event_date,
        venue=client.venue,
        drive_folder_id=client.drive_folder_id,
        drive_folder_url=client.drive_folder_url,
        cover=cover_for(client, photos),
        cover_photo_id=client.cover_photo_id,
        photo_count=len(photos),
        synced_at=_with_tz(client.synced_at),
        photos=[to_photo_out(p) for p in photos],
    )
