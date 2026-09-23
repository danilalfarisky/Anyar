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
