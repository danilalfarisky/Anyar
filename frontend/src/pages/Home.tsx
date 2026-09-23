import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Images, Search, SearchX, WifiOff } from "lucide-react";
import NavigationHeader from "@/components/NavigationHeader";
import HeroWeddingBanner from "@/components/HeroWeddingBanner";
import ClientCard from "@/components/ClientCard";
import { apiGet } from "@/lib/api";
import type { ClientSummary } from "@/lib/types";
import { Input } from "@/components/ui/input";

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E7DFD5] bg-white">
      <div className="aspect-[4/3] animate-pulse bg-[#F5EFEB]" />
      <div className="space-y-3 p-5">
        <div className="h-5 w-2/3 animate-pulse rounded bg-[#F5EFEB]" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-[#F5EFEB]" />
      </div>
    </div>
  );
}

function NoticeCard({ icon, title, body, children }: { icon: React.ReactNode; title: string; body: string; children?: React.ReactNode }) {
  return (
    <div className="mx-auto mt-10 max-w-md rounded-2xl border border-[#E7DFD5] bg-white p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F5EFEB] text-[#9A6B2F]">
        {icon}
      </div>
      <h3 className="mt-4 font-heading text-xl text-[#1C1917]">{title}</h3>
      <p className="mt-2 text-sm text-[#78716C]">{body}</p>
      {children}
    </div>
  );
}

export default function Home() {
  const [search, setSearch] = useState("");
  const { data: clients, isPending, isError } = useQuery({
    queryKey: ["clients"],
    queryFn: () => apiGet<ClientSummary[]>("/clients"),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  const filtered = useMemo(() => {
    if (!clients) return [];
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.venue ?? "").toLowerCase().includes(q),
    );
  }, [clients, search]);

  const hasClients = (clients?.length ?? 0) > 0;

  return (
    <div className="min-h-svh bg-[#FAF8F5]">
      <NavigationHeader />
      <HeroWeddingBanner />

      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase text-[#9A6B2F]" style={{ letterSpacing: "0.25em" }}>
              Portofolio
            </p>
            <h2 className="mt-3 font-heading text-3xl text-[#1C1917] sm:text-4xl">Kisah Cinta Klien Kami</h2>
            <p className="mt-2 max-w-xl text-sm text-[#78716C]">
              Setiap pasangan memiliki cerita — pilih nama untuk menjelajahi galeri foto pernikahan mereka.
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#78716C]" />
            <Input
              data-testid="search-client-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama klien atau lokasi…"
              className="border-[#E7DFD5] bg-white pl-9"
            />
          </div>
        </div>

        {isPending && (
          <div data-testid="clients-skeleton" className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {!isPending && isError && !hasClients && (
          <NoticeCard
            icon={<WifiOff className="h-5 w-5" />}
            title="Galeri sedang tidak dapat dimuat"
            body="Koneksi ke server terganggu. Silakan muat ulang halaman dalam beberapa saat."
          />
        )}

        {!isPending && !isError && !hasClients && (
          <NoticeCard
            icon={<Images className="h-5 w-5" />}
            title="Belum ada klien"
            body="Galeri ini masih kosong. Tambahkan klien wedding pertama melalui Area Admin."
          >
            <Link to="/admin" className="mt-5 inline-flex text-sm font-medium text-[#9A6B2F] hover:text-[#7D5321]">
              Buka Area Admin →
            </Link>
          </NoticeCard>
        )}

        {!isPending && hasClients && filtered.length === 0 && (
          <NoticeCard
            icon={<SearchX className="h-5 w-5" />}
            title="Tidak ditemukan"
            body={`Tidak ada klien yang cocok dengan pencarian "${search}". Coba kata kunci lain.`}
          />
        )}

        {!isPending && filtered.length > 0 && (
          <div data-testid="clients-grid" className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 md:gap-10">
            {filtered.map((client, i) => (
              <div
                key={client.id}
                style={{ animationDelay: `${Math.min(i * 60, 400)}ms` }}
                className="animate-in fade-in slide-in-from-bottom-4 duration-500"
              >
                <ClientCard client={client} />
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-[#E7DFD5] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-[#78716C] sm:flex-row sm:px-6 lg:px-8">
          <p className="font-heading italic">Arsa Wedding Gallery</p>
          <p>Setiap momen bahagia layak dikenang selamanya.</p>
        </div>
      </footer>
    </div>
  );
}
