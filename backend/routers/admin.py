"""Admin endpoints — one shared PIN, httpOnly-cookie session, full client CRUD + Drive sync."""

import hashlib
import hmac
import logging
import os

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from pydantic import BaseModel, Field

from lib.db import db
from lib.drive import DriveError, parse_folder_id
from lib.sync import sync_client_photos
from models.clients import AdminClient, Client, ClientCreate, ClientUpdate, utcnow

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["admin"])

SESSION_COOKIE = "admin_session"
SESSION_MAX_AGE = 7 * 24 * 60 * 60


def _session_token() -> str:
    secret = os.environ.get("SESSION_SECRET", "dev-secret")
    return hmac.new(secret.encode(), b"admin-session-v1", hashlib.sha256).hexdigest()


def _is_admin(admin_session: str | None) -> bool:
    return bool(admin_session) and hmac.compare_digest(admin_session, _session_token())


def require_admin(admin_session: str | None = Cookie(default=None)) -> None:
    if not _is_admin(admin_session):
        raise HTTPException(status_code=401, detail="Sesi admin tidak valid — masuk kembali")


class LoginInput(BaseModel):
    pin: str = Field(min_length=1)


@router.post("/login")
async def admin_login(input: LoginInput, response: Response):
    expected = os.environ.get("ADMIN_PIN", "").strip()
    if not expected or input.pin.strip() != expected:
        raise HTTPException(status_code=401, detail="PIN salah")
    response.set_cookie(
        SESSION_COOKIE,
        _session_token(),
        httponly=True,
        samesite="lax",
        max_age=SESSION_MAX_AGE,
        path="/",
    )
    return {"ok": True}


@router.post("/logout")
async def admin_logout(response: Response):
    response.delete_cookie(SESSION_COOKIE, path="/")
    return {"ok": True}


@router.get("/me")
async def admin_me(admin_session: str | None = Cookie(default=None)):
    return {"authenticated": _is_admin(admin_session)}


async def _photo_counts() -> dict[str, int]:
    counts: dict[str, int] = {}
    async for doc in db.photos.aggregate([{"$group": {"_id": "$client_id", "n": {"$sum": 1}}}]):
        counts[doc["_id"]] = doc["n"]
    return counts


def _admin_out(client: Client, photo_count: int) -> AdminClient:
    return AdminClient(**client.model_dump(), photo_count=photo_count)


def _apply_folder(client: Client, raw: str | None) -> str:
    """Parse the pasted link onto the client; returns the raw string to persist."""
    raw = (raw or "").strip()
    folder_id = parse_folder_id(raw)
    if raw and not folder_id:
        raise HTTPException(status_code=400, detail="Link folder Google Drive tidak valid")
    client.drive_folder_id = folder_id
    client.drive_folder_url = raw or None
    return raw


@router.get("/clients", response_model=list[AdminClient], dependencies=[Depends(require_admin)])
async def admin_list_clients():
    counts = await _photo_counts()
    docs = await db.clients.find().sort([("sort_order", 1), ("name", 1)]).to_list(500)
    return [_admin_out(Client(**d), counts.get(d["id"], 0)) for d in docs]


@router.post("/clients", response_model=AdminClient, dependencies=[Depends(require_admin)])
async def admin_create_client(input: ClientCreate):
    client = Client(
        name=input.name.strip(),
        event_date=(input.event_date or "").strip() or None,
        venue=(input.venue or "").strip() or None,
        cover_url=(input.cover_url or "").strip() or None,
    )
    _apply_folder(client, input.drive_folder)
    last = await db.clients.find_one({}, sort=[("sort_order", -1)])
    client.sort_order = (int(last["sort_order"]) + 1) if last else 1
    await db.clients.insert_one(client.model_dump())
    if client.drive_folder_id:
        try:
            await sync_client_photos(client)
        except DriveError as exc:
            await db.clients.delete_one({"id": client.id})  # bad link — let the admin retry
            raise HTTPException(status_code=400, detail=str(exc))
    counts = await _photo_counts()
    return _admin_out(client, counts.get(client.id, 0))


@router.put("/clients/{client_id}", response_model=AdminClient, dependencies=[Depends(require_admin)])
async def admin_update_client(client_id: str, input: ClientUpdate):
    doc = await db.clients.find_one({"id": client_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Klien tidak ditemukan")
    client = Client(**doc)
    updates = input.model_dump(exclude_unset=True)
    folder_changed = False
    if "drive_folder" in updates:
        raw = _apply_folder(client, updates.pop("drive_folder"))
        folder_changed = raw != (client.drive_folder_url or "")
    if "name" in updates:
        name = (updates["name"] or "").strip()
        if not name:
            raise HTTPException(status_code=400, detail="Nama klien wajib diisi")
        updates["name"] = name
    if "event_date" in updates:
        updates["event_date"] = (updates["event_date"] or "").strip() or None
    if "venue" in updates:
        updates["venue"] = (updates["venue"] or "").strip() or None
    if "cover_url" in updates:
        updates["cover_url"] = (updates["cover_url"] or "").strip() or None
    for key, value in updates.items():
        setattr(client, key, value)
    await db.clients.replace_one({"id": client_id}, client.model_dump())
    if folder_changed and client.drive_folder_id:
        try:
            await sync_client_photos(client)
        except DriveError as exc:  # keep the saved client; the sync button surfaces the error
            logger.warning("sync after update failed: %s", exc)
    counts = await _photo_counts()
    return _admin_out(client, counts.get(client.id, 0))


@router.delete("/clients/{client_id}", dependencies=[Depends(require_admin)])
async def admin_delete_client(client_id: str):
    await db.clients.delete_one({"id": client_id})
    await db.photos.delete_many({"client_id": client_id})
    return {"ok": True}


@router.post("/clients/{client_id}/sync", dependencies=[Depends(require_admin)])
async def admin_sync_client(client_id: str):
    doc = await db.clients.find_one({"id": client_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Klien tidak ditemukan")
    client = Client(**doc)
    if not client.drive_folder_id:
        raise HTTPException(
            status_code=400,
            detail="Klien ini belum memiliki folder Google Drive — tambahkan link foldernya dahulu",
        )
    try:
        count = await sync_client_photos(client)
    except DriveError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {"photo_count": count, "synced_at": utcnow().isoformat()}
