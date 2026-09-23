# Arsa Wedding Gallery — App Spec

## What it is
Wedding photo gallery web app (Indonesian UI). Guests browse client wedding galleries with ZERO
login. Each client has a photo folder linked to a public Google Drive folder. An admin (shared PIN)
manages clients.

## Data model (Mongo `app` db)
- `clients`: `{id (uuid str), name, event_date ("YYYY-MM-DD"|null), venue, drive_folder_id,
  drive_folder_url, cover_url (admin override), sort_order, synced_at, created_at}`
- `photos`: `{id (uuid str), client_id, drive_file_id (null for demo/URL photos), url, name, position}`
  — synced from the client's Drive folder; rows without `drive_file_id` survive re-syncs.

## Automatic Drive sync (no manual step, no "open in Drive")
- `backend/lib/poller.py` runs in the FastAPI lifespan and re-reads every client's Drive folder
  every `DRIVE_POLL_SECONDS` (default 60) → photos exported from Capture One into Drive appear on
  the site by themselves.
- `backend/lib/sync.py` is INCREMENTAL: existing photo rows keep their ids (no flicker), new Drive
  files are appended, deleted files are removed.
- `GET /api/clients/:id` also re-syncs when the cache is >45s old (`STALE_AFTER_SECONDS`).
- Frontend auto-refreshes: gallery query `refetchInterval` 30s, home 60s, both refetch on window
  focus — an open gallery updates without reload.
- Drive listing walks SUBFOLDERS recursively (depth 4) and paginates past 1000 files.
- The guest-facing "Buka di Drive" link was REMOVED by user request; the badge now reads
  "Foto diperbarui otomatis". Admin table still links the folder id for management.

## Key flows
- Guest home `/`: hero + client cards (cover, name, date, venue, photo count) + search filter.
- Guest gallery `/gallery/:clientId`: masonry photo grid + lightbox (←/→/ESC, download).
  `GET /api/clients/:id` auto-resyncs from Drive when cache is empty or >6h stale.
- Admin `/admin`: PIN gate (`POST /api/admin/login` sets httpOnly cookie `admin_session`, HMAC of
  SESSION_SECRET). CRUD clients (`POST/PUT/DELETE /api/admin/clients...`), manual resync
  (`POST /api/admin/clients/:id/sync`). Folder link (URL or bare id) parsed server-side.
- Google Drive listing: API key if `GOOGLE_DRIVE_API_KEY` set, else zero-credential scrape of
  `drive.google.com/embeddedfolderview?id=<fid>` (filters entries by `type/image/` mime marker or
  image extension). Thumbnails: `drive.google.com/thumbnail?id=<fid>&sz=w900`; full:
  `lh3.googleusercontent.com/d/<fid>=w2000`. Verified live against a public folder.

## Seed state
`backend/seed.py` (idempotent, resets collections): 6 demo wedding clients (Aditya & Clarissa,
Bimantara & Alyssa, Reza & Nadia, Dimas & Keisha, Farhan & Zahra, Jonathan & Valerie) with
curated sample photos — these have NO Drive folder attached (demo URL photos). Admin attaches real
Drive folders via /admin.

## Notes
- Status routes from the template (`/api/status`) remain.
- Public demo content uses Unsplash/Pexels URLs; Drive flow is real (verified end-to-end via API).
