import { Link, useLocation } from "react-router-dom";
import { Heart } from "lucide-react";

export default function NavigationHeader() {
  const { pathname } = useLocation();
  const linkClass = (active: boolean) =>
    `text-sm font-medium transition-colors ${
      active ? "text-[#9A6B2F]" : "text-[#57534E] hover:text-[#1C1917]"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-[#E7DFD5] bg-[#FAF8F5]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" data-testid="nav-brand-logo" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E7DFD5] bg-white text-[#9A6B2F]">
            <Heart className="h-4 w-4" fill="currentColor" strokeWidth={1} />
          </span>
          <span className="font-heading text-lg tracking-tight text-[#1C1917]">
            Arsa <span className="italic text-[#9A6B2F]">Wedding</span> Gallery
          </span>
        </Link>
        <nav className="flex items-center gap-5 sm:gap-8">
          <Link to="/" data-testid="nav-home-link" className={linkClass(pathname === "/")}>
            Beranda
          </Link>
          <Link to="/admin" data-testid="nav-admin-link" className={linkClass(pathname === "/admin")}>
            Area Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
