import { Link, useLocation } from "react-router-dom";
import { Heart } from "lucide-react";

interface Props {
  brandName?: string;
}

function monogram(name: string): string {
  const words = name.replace(/&/g, " ").split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "AW";
}

export default function NavigationHeader({ brandName = "Arsa Wedding Gallery" }: Props) {
  const { pathname } = useLocation();
  const linkClass = (active: boolean) =>
    `text-[11px] font-medium uppercase transition-colors ${
      active ? "text-[var(--gold-soft)]" : "text-[var(--cream-muted)] hover:text-[var(--cream)]"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[#150609]/88 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" data-testid="nav-brand-logo" className="flex min-w-0 shrink items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--gold)]/40 bg-[#2E1118] text-[10px] font-semibold tracking-wider text-[var(--gold-soft)]">
            {monogram(brandName)}
          </span>
          <span className="max-w-[9.5rem] truncate font-heading text-base text-[var(--cream)] sm:max-w-none">
            {brandName}
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
