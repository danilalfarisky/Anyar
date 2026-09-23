// Hand-written mirrors of the Pydantic models in backend/models/clients.py —
// nothing infers across the HTTP boundary, keep both in sync in the same edit.

export interface Photo {
  id: string;
  name: string;
  thumb: string;
  full: string;
  alt?: string | null; // fallback URL used if the primary image CDN fails
}

export interface ClientSummary {
  id: string;
  name: string;
  event_date: string | null;
  venue: string | null;
  cover: string | null;
  photo_count: number;
}

export interface ClientDetail {
  id: string;
  name: string;
  event_date: string | null;
  venue: string | null;
  drive_folder_id: string | null;
  drive_folder_url: string | null;
  cover: string | null;
  cover_photo_id: string | null;
  photo_count: number;
  synced_at: string | null;
  photos: Photo[];
}

export interface AdminClient {
  id: string;
  name: string;
  event_date: string | null;
  venue: string | null;
  drive_folder_id: string | null;
  drive_folder_url: string | null;
  cover_url: string | null;
  cover_photo_id: string | null;
  custom_photo_order: boolean;
  sort_order: number;
  synced_at: string | null;
  created_at: string;
  photo_count: number;
}

export interface ClientInput {
  name: string;
  event_date?: string | null;
  venue?: string | null;
  drive_folder?: string | null;
  cover_url?: string | null;
}

export interface AdminMe {
  authenticated: boolean;
}
