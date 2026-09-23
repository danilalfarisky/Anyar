import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, CalendarDays, Images, MapPin, WifiOff } from "lucide-react";
import NavigationHeader from "@/components/NavigationHeader";
import GoogleDriveSyncBadge from "@/components/GoogleDriveSyncBadge";
import PhotoLightbox from "@/components/PhotoLightbox";
import { apiGet } from "@/lib/api";
import type { ClientDetail } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";

export default function Gallery() {
  const { clientId } = useParams<{ clientId: string }>();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { data: client, isPending, isError } = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => apiGet<ClientDetail>(`/clients/${clientId}`),
    enabled: Boolean(clientId),
    retry: false,
  });

  return (
    <div className="min-h-svh bg-[#FAF8F5]">
      <NavigationHeader />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          to="/"
          data-testid="gallery-back-button"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#57534E] transition-colors hover:text-[#9A6B2F]"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke daftar klien
        </Link>

        {isPending && (
          <div data-testid="gallery-skeleton" className="mt-8">
            <div className="h-10 w-1/2 animate-pulse rounded bg-[#F5EFEB]" />
            <div className="mt-3 h-5 w-1/3 animate-pulse rounded bg-[#F5EFEB]" />
            <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="mb-4 break-inside-avoid animate-pulse rounded-xl bg-[#F5EFEB]"
                  style={{ height: `${200 + ((i * 67) % 160)}px` }}
                />
              ))}
            </div>
          </div>
        )}

        {!isPending && (isError || !client) && (
          <div className="mx-auto mt-16 max-w-md rounded-2xl border border-[#E7DFD5] bg-white p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F5EFEB] text-[#9A6B2F]">
              <WifiOff className="h-5 w-5" />
            </div>
            <h2 className="mt-4 font-heading text-xl text-[#1C1917]">Galeri tidak ditemukan</h2>
            <p className="mt-2 text-sm text-[#78716C]">
              Galeri ini mungkin telah dipindahkan atau tautannya salah.
            </p>
            <Link to="/" className={`mt-6 ${buttonVariants({ variant: "outline" })}`}>
              Lihat Semua Klien
            </Link>
          </div>
        )}

        {client && (
          <>
            <header className="mt-6 border-b border-[#E7DFD5] pb-8">
              <p className="text-xs font-medium uppercase text-[#9A6B2F]" style={{ letterSpacing: "0.25em" }}>
                Galeri Pernikahan
              </p>
              <h1 data-testid="gallery-title" className="mt-3 font-heading text-4xl text-[#1C1917] sm:text-5xl">
                {client.name}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#78716C]">
                {client.event_date && (
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-[#9A6B2F]" />
                    {formatDate(client.event_date)}
                  </span>
                )}
                {client.venue && (
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#9A6B2F]" />
                    {client.venue}
                  </span>
                )}
                <span data-testid="gallery-photo-count" className="inline-flex items-center gap-2">
                  <Images className="h-4 w-4 text-[#9A6B2F]" />
                  {client.photo_count} Foto
                </span>
              </div>
              <div className="mt-4">
                <GoogleDriveSyncBadge driveFolderUrl={client.drive_folder_url} syncedAt={client.synced_at} />
              </div>
            </header>

            {client.photos.length === 0 ? (
              <div className="mx-auto mt-16 max-w-md rounded-2xl border border-[#E7DFD5] bg-white p-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F5EFEB] text-[#9A6B2F]">
                  <Images className="h-5 w-5" />
                </div>
                <h2 className="mt-4 font-heading text-xl text-[#1C1917]">Belum ada foto</h2>
                <p className="mt-2 text-sm text-[#78716C]">
                  Folder Google Drive untuk klien ini masih kosong atau belum terhubung. Foto akan
                  muncul otomatis setelah folder memuat foto dan tersinkron.
                </p>
              </div>
            ) : (
              <div data-testid="gallery-photo-grid" className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4 md:gap-6">
                {client.photos.map((photo, i) => (
                  <motion.button
                    key={photo.id}
                    type="button"
                    data-testid="gallery-photo-item"
                    onClick={() => setLightboxIndex(i)}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "0px 0px -40px 0px" }}
                    transition={{ duration: 0.4, delay: Math.min(i * 0.03, 0.4), ease: "easeOut" }}
                    className="group mb-4 block w-full overflow-hidden rounded-xl border border-[#E7DFD5] bg-white break-inside-avoid shadow-sm md:mb-6"
                    aria-label={`Lihat foto ${i + 1}`}
                  >
                    <img
                      src={photo.thumb}
                      alt={photo.name}
                      loading="lazy"
                      className="w-full transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </motion.button>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <AnimatePresence>
        {client && lightboxIndex !== null && (
          <PhotoLightbox
            photos={client.photos}
            index={Math.min(lightboxIndex, client.photos.length - 1)}
            onClose={() => setLightboxIndex(null)}
            onNavigate={setLightboxIndex}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
