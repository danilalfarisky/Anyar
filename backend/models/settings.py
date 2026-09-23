"""Site-level presentation settings (hero text/image) — editable by the admin.

Stored as a single document in `db.settings` keyed by `key = "site"`, so the guest
landing page can be customised without touching code.
"""

from pydantic import BaseModel

DEFAULT_HERO_IMAGE = (
    "https://images.unsplash.com/photo-1731566971965-acfb1151fc34?crop=entropy&cs=srgb&fm=jpg&q=85"
)


class SiteSettings(BaseModel):
    brand_name: str = "Arsa Wedding Gallery"
    hero_overline: str = "MOMENT ALBUM"
    hero_title: str = "Cerita Cinta Mereka"
    hero_date: str = ""
    hero_cta: str = "SCROLL TO MEMORIES"
    hero_image_url: str = DEFAULT_HERO_IMAGE
    footer_note: str = "Setiap momen bahagia layak dikenang selamanya."


class SiteSettingsUpdate(BaseModel):
    brand_name: str | None = None
    hero_overline: str | None = None
    hero_title: str | None = None
    hero_date: str | None = None
    hero_cta: str | None = None
    hero_image_url: str | None = None
    footer_note: str | None = None
