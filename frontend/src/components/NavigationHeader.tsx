import { Link, useLocation } from "react-router-dom";
import { Heart } from "lucide-react";
import { useSettings } from "@/lib/useSettings";

function monogram(name: string): string {
  const words = name.replace(/&/g, " ").split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "AW";
}

/** Brand comes from the admin's settings, so every page shows the same name. */
export default function NavigationHeader() {
  const { pathname } = useLocation();
  const { brand_name } = useSettings();
  const linkClass = (active: boolean) =>
    `text-[11px] font-medium uppercase transition-colors ${
      active ? "text-[var(--gold-soft)]" : "text-[var(--cream-muted)] hover:text-[var(--cream)]"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--ink)]/88 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          to="/"
          data-testid="nav-brand-logo"
          className="flex min-w-0 shrink items-center gap-2.5"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--gold)]/40 bg-[var(--surface-2)] text-[10px] font-semibold tracking-wider text-[var(--gold-soft)]">
            {monogram(brand_name)}
          </span>
          <span
            data-testid="nav-brand-name"
            className="max-w-[9.5rem] truncate font-heading text-base text-[var(--cream)] sm:max-w-none"
          >
            {brand_name}
          </span>
        </Link>
        <nav className="flex shrink-0 items-center gap-5" style={{ letterSpacing: "0.16em" }}>
          <Link to="/" data-testid="nav-home-link" className={linkClass(pathname === "/")}>
            Beranda
          </Link>
          <Link
            to="/admin"
            data-testid="nav-admin-link"
            className={linkClass(pathname === "/admin")}
          >
            Admin
          </Link>
          <Heart className="h-3.5 w-3.5 text-[var(--blush)]" fill="currentColor" strokeWidth={0} />
        </nav>
      </div>
    </header>
  );
}
