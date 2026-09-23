import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import type { ClientSummary } from "@/lib/types";
import { formatDate } from "@/lib/format";

function initials(name: string): string {
  return name
    .replace(/&/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export default function ClientCard({ client }: { client: ClientSummary }) {
  return (
    <Link
      to={`/gallery/${client.id}`}
      data-testid="client-card-item"
      className="group block overflow-hidden rounded-2xl border border-[#E7DFD5] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#F5EFEB]">
        {client.cover ? (
          <img
            src={client.cover}
            alt={client.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-heading text-5xl italic text-[#9A6B2F]/70">
              {initials(client.name)}
            </span>
          </div>
        )}
        <span className="absolute right-3 top-3 rounded-full border border-[#E7DFD5] bg-[#FEF3C7]/95 px-3 py-1 text-xs font-medium text-[#78350F]">
          {client.photo_count} Foto
        </span>
      </div>
      <div className="p-5">
        <h3 data-testid="client-card-title" className="font-heading text-xl text-[#1C1917]">
          {client.name}
        </h3>
        <p data-testid="client-card-date" className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#78716C]">
          <CalendarDays className="h-4 w-4 shrink-0 text-[#9A6B2F]" />
          {formatDate(client.event_date) || "Tanggal acara menyusul"}
          {client.venue && (
            <>
              <span aria-hidden>•</span>
              <MapPin className="h-4 w-4 shrink-0 text-[#9A6B2F]" />
              {client.venue}
            </>
          )}
        </p>
        <span
          data-testid="client-card-open-btn"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#9A6B2F] transition-colors group-hover:text-[#7D5321]"
        >
          Buka Galeri Foto
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
