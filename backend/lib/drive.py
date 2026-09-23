"""Google Drive helpers — list photos from a PUBLIC ("anyone with the link") folder.

Two strategies, tried in order:
1. Drive API v3 `files.list` with a simple API key (`GOOGLE_DRIVE_API_KEY` in
   backend/.env) — the reliable path; create a free key at console.cloud.google.com
   (enable "Google Drive API", create an API key, restrict it to Drive).
2. Zero-credential fallback: parse the folder's public "embedded folder view"
   (https://drive.google.com/embeddedfolderview?id=...), which works for any
   folder shared as "anyone with the link".

Both return bare file ids + names; display URLs are built by `thumb_url`/`full_url`.
"""

import logging
import os
import re
from dataclasses import dataclass

import httpx

logger = logging.getLogger(__name__)

_FOLDER_IN_URL = re.compile(r"/folders/([\w-]{10,})")
_ID_IN_URL = re.compile(r"[?&]id=([\w-]{10,})")
_RAW_ID = re.compile(r"^[\w-]{10,}$")
_ENTRY_ID = re.compile(r'id="entry-([\w-]{20,})"')
_ENTRY_TITLE = re.compile(r'class="flip-entry-title">\s*([^<]*?)\s*<')
_IMAGE_EXTS = (".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic", ".bmp", ".tif", ".tiff")
_UA_HEADERS = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"}


@dataclass
class DrivePhoto:
    drive_file_id: str
    name: str


class DriveError(Exception):
    """The folder could not be listed (not shared publicly, bad id, network, ...)."""


def parse_folder_id(text: str | None) -> str | None:
    """Accept a full folder URL, a bare folder id, or nothing."""
    text = (text or "").strip()
    if not text:
        return None
    for pattern in (_FOLDER_IN_URL, _ID_IN_URL):
        m = pattern.search(text)
        if m:
            return m.group(1)
    if _RAW_ID.match(text):
        return text
    return None


def thumb_url(file_id: str) -> str:
    return f"https://drive.google.com/thumbnail?id={file_id}&sz=w900"


def full_url(file_id: str) -> str:
    return f"https://lh3.googleusercontent.com/d/{file_id}=w2000"


async def list_drive_photos(folder_id: str) -> list[DrivePhoto]:
    """All image files directly inside the folder, ordered by name."""
    api_key = os.environ.get("GOOGLE_DRIVE_API_KEY", "").strip()
    if api_key:
        try:
            return await _list_via_api(folder_id, api_key)
        except DriveError as exc:
            logger.warning("Drive API listing failed for %s (%s) — trying scrape fallback", folder_id, exc)
    return await _list_via_scrape(folder_id)


async def _list_via_api(folder_id: str, api_key: str) -> list[DrivePhoto]:
    params = {
        "q": f"'{folder_id}' in parents and mimeType contains 'image/' and trashed = false",
        "fields": "files(id,name)",
        "orderBy": "name_natural",
        "pageSize": "1000",
        "key": api_key,
    }
    async with httpx.AsyncClient(timeout=20) as http:
        res = await http.get("https://www.googleapis.com/drive/v3/files", params=params)
    if res.status_code != 200:
        try:
            message = res.json()["error"]["message"]
        except Exception:
            message = res.text[:200]
        raise DriveError(f"Google Drive API error {res.status_code}: {message}")
    files = res.json().get("files", [])
    return [DrivePhoto(drive_file_id=f["id"], name=f.get("name", "")) for f in files]


async def _list_via_scrape(folder_id: str) -> list[DrivePhoto]:
    url = f"https://drive.google.com/embeddedfolderview?id={folder_id}#grid"
    async with httpx.AsyncClient(timeout=20, follow_redirects=True, headers=_UA_HEADERS) as http:
        res = await http.get(url)
    if res.status_code != 200:
        raise DriveError(
            f"Folder tidak dapat diakses (HTTP {res.status_code}) — pastikan folder dibagikan "
            "ke 'Siapa saja yang memiliki link' "
        )
    html = res.text
    if "flip-entry" not in html:
        raise DriveError(
            "Folder tidak berisi file, atau belum dibagikan ke 'Siapa saja yang memiliki link'"
        )
    photos: list[DrivePhoto] = []
    seen: set[str] = set()
    matches = list(_ENTRY_ID.finditer(html))
    for i, m in enumerate(matches):
        file_id = m.group(1)
        if file_id in seen:
            continue
        seen.add(file_id)
        block = html[m.end(): matches[i + 1].start() if i + 1 < len(matches) else len(html)]
        title_m = _ENTRY_TITLE.search(block)
        title = title_m.group(1).strip() if title_m else ""
        # each entry carries its mime type in the list-icon URL, e.g. .../type/image/jpeg
        is_image = "type/image/" in block or title.lower().endswith(_IMAGE_EXTS)
        if not is_image:
            continue  # subfolders/docs render generic icons, not image previews
        photos.append(DrivePhoto(drive_file_id=file_id, name=title or f"Foto {len(photos) + 1}"))
    return photos
