# Arsa Wedding Gallery — App Spec

Wedding photo gallery web app (Indonesian UI, mobile-portrait first). Guests browse client
galleries with ZERO login. Photos come from PUBLIC Google Drive folders and sync automatically.

## Look & feel
- Dark **maroon + soft gold** theme (`frontend/src/index.css`): `--maroon #8E1F32`, `--gold #D9A94B`,
  ink `#150609`, cream `#FBF3EE`, blush `#E8A9B4`. `index.html` has `class="dark"`.
- Fonts: **Playfair Display Variable** (headings) + **Outfit Variable** (body) — elegant + Gen-Z friendly.
- Custom animations: `gold-shimmer-text`, `scroll-cue`, `folder-sheen`, `grain-overlay`.

## Screens (routes in `frontend/src/App.tsx`)
- `/` **Home** — full-screen portrait hero (overline • date • big shimmering title • scroll cue,
  all admin-editable) → scroll → grid of **folder cards**, one per client (2 cols mobile, 4 desktop).
- `/gallery/:clientId` — couple header, then **folder cards for Drive subfolders** (Akad, Resepsi…).
  Photos appear only after opening a folder (`?album=<driveFolderId>`). If a client has no
  subfolders (single `__root__` album), photos show immediately. Lightbox: ←/→/ESC + download.
- `/admin` — PIN gate, hero/brand settings form, client CRUD, photo order & cover manager.

## Data model (Mongo `app` db)
- `clients`: `{id, name, event_date, venue, drive_folder_id, drive_folder_url, cover_url,
  cover_photo_id, custom_photo_order, sort_order, synced_at, created_at}`
- `photos`: `{id, client_id, drive_file_id, url, name, position, album_id, album_name}` —
  `album_id` is the TOP-LEVEL Drive subfolder (None → grouped as "Foto Lainnya" / `__root__`).
- `settings`: single doc `{key: "site", brand_name, hero_overline, hero_title, hero_date,
  hero_cta, hero_image_url, footer_note}`.

## Automatic Drive sync (no manual step, no "open in Drive")
- `backend/lib/poller.py` runs in the FastAPI lifespan, re-reading every client's Drive folder each
  `DRIVE_POLL_SECONDS` (default 60) → Capture One exports appear by themselves.
- `backend/lib/sync.py` is INCREMENTAL (stable photo ids, no flicker) and preserves manual order.
- `GET /api/clients/:id` also re-syncs when cache >45s old. Frontend refetches: gallery 30s, home 60s.
- `backend/lib/drive.py` walks SUBFOLDERS recursively (depth 4), paginates past 1000 files, detects
  images via the `type/image/*` mime marker, and tags each photo with its top-level album.
- Guest-facing "Buka di Drive" link was REMOVED by user request; badge reads "Foto diperbarui otomatis".

## Photo order & cover pick (admin)
- `PUT /api/admin/clients/{id}/photos/order` `{photo_ids}` → sets `position`, flips
  `custom_photo_order = true` so sync appends new photos at the end instead of re-sorting.
- `PUT /api/admin/clients/{id}/cover` `{photo_id|null}`. Cover precedence: picked photo →
  `cover_url` → first photo.
- UI: `PhotoManagerModal.tsx` (arrows reorder, star sets cover), opened via `admin-client-photos-btn`.

## API surface (all under /api)
Public: `GET /clients`, `GET /clients/{id}`, `GET /settings`.
Admin (httpOnly cookie `admin_session`, HMAC of SESSION_SECRET): `POST /admin/login|logout`,
`GET /admin/me`, `GET/POST/PUT/DELETE /admin/clients[...]`, `POST /admin/clients/{id}/sync`,
`PUT /admin/clients/{id}/photos/order`, `PUT /admin/clients/{id}/cover`, `GET/PUT /admin/settings`.

## Current data
- `wanda danil` — the user's real client, linked to Drive folder `1UzC7d5WOherVK0yg3-y6OU2pQcTSPLAO`
  (9 photos at root, no subfolders → photos show directly).
- `Febri & Vini (Demo)` — demo client with 3 albums (Prewedding 6, Akad Nikah 7, Resepsi 8) using
  stock photos, created to demonstrate the folder UX. Safe to delete from /admin.
- `backend/seed.py` still holds the original 6-client demo seed (not currently applied).
