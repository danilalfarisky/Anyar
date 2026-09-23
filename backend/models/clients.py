"""Pydantic models for wedding clients and their Google-Drive-backed photo galleries."""

import uuid
from datetime import datetime, timezone

from pydantic import BaseModel, Field

from lib.drive import alt_url, full_url, thumb_url


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def new_id() -> str:
    return str(uuid.uuid4())


class Client(BaseModel):
    id: str = Field(default_factory=new_id)
    name: str
    event_date: str | None = None  # ISO "YYYY-MM-DD"
    venue: str | None = None
    drive_folder_id: str | None = None
    drive_folder_url: str | None = None  # the link as pasted by admin (for "open in Drive")
    cover_url: str | None = None  # admin override; defaults to the first photo
    sort_order: int = 0
    synced_at: datetime | None = None
    created_at: datetime = Field(default_factory=utcnow)


class Photo(BaseModel):
    id: str = Field(default_factory=new_id)
    client_id: str
    drive_file_id: str | None = None  # None for demo/manual-URL photos
    url: str = ""
    name: str = ""
    position: int = 0


# ---- Response shapes (mirrored by frontend/src/lib/types.ts — keep in sync) ----


class PhotoOut(BaseModel):
    id: str
    name: str
    thumb: str
    full: str
    alt: str | None = None  # fallback URL if the primary image CDN fails


class ClientSummary(BaseModel):
    id: str
    name: str
    event_date: str | None
    venue: str | None
    cover: str | None
    photo_count: int


class ClientDetail(BaseModel):
    id: str
    name: str
    event_date: str | None
    venue: str | None
    drive_folder_id: str | None
    drive_folder_url: str | None
    cover: str | None
    photo_count: int
    synced_at: datetime | None
    photos: list[PhotoOut]


class AdminClient(Client):
    photo_count: int


# ---- Input shapes ----


class ClientCreate(BaseModel):
    name: str = Field(min_length=1)
    event_date: str | None = None
    venue: str | None = None
    drive_folder: str | None = None  # folder URL or bare id, parsed server-side
    cover_url: str | None = None


class ClientUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    event_date: str | None = None
    venue: str | None = None
    drive_folder: str | None = None
    cover_url: str | None = None


def to_photo_out(photo: Photo) -> PhotoOut:
    if photo.drive_file_id:
        return PhotoOut(
            id=photo.id,
            name=photo.name,
            thumb=thumb_url(photo.drive_file_id),
            full=full_url(photo.drive_file_id),
            alt=alt_url(photo.drive_file_id),
        )
    return PhotoOut(id=photo.id, name=photo.name, thumb=photo.url, full=photo.url)


def cover_for(client: Client, photos: list[Photo]) -> str | None:
    if client.cover_url:
        return client.cover_url
    if photos:
        return to_photo_out(photos[0]).thumb
    return None
