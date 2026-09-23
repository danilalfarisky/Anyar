"""Sync a client's Google Drive folder into the `photos` collection."""

import logging
import uuid
from datetime import datetime, timezone

from lib.db import db
from lib.drive import list_drive_photos
from models.clients import Client

logger = logging.getLogger(__name__)


async def sync_client_photos(client: Client) -> int:
    """Replace this client's Drive-backed photos with the folder's current contents.

    Rows without a `drive_file_id` (demo/manual URL photos) are preserved.
    Returns the number of Drive photos now attached.
    """
    if not client.drive_folder_id:
        return 0
    items = await list_drive_photos(client.drive_folder_id)
    await db.photos.delete_many({"client_id": client.id, "drive_file_id": {"$ne": None}})
    if items:
        docs = [
            {
                "id": str(uuid.uuid4()),
                "client_id": client.id,
                "drive_file_id": item.drive_file_id,
                "name": item.name,
                "url": "",
                "position": offset,
            }
            for offset, item in enumerate(items)
        ]
        await db.photos.insert_many(docs)
    await db.clients.update_one(
        {"id": client.id}, {"$set": {"synced_at": datetime.now(timezone.utc)}}
    )
    logger.info("synced %d drive photos for client %s", len(items), client.id)
    return len(items)
