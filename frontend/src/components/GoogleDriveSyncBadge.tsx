import { Images, RefreshCw } from "lucide-react";
import { formatDateTime } from "@/lib/format";

interface Props {
  driveFolderUrl: string | null;
  syncedAt: string | null;
}

/** Shows where the photos come from. Guests never need to leave for Google Drive —
 *  the folder is watched automatically, so new exports appear here on their own. */
export default function GoogleDriveSyncBadge({ driveFolderUrl, syncedAt }: Props) {
  if (!driveFolderUrl) {
    return (
      <span
        data-testid="drive-sync-badge"
        className="inline-flex items-center gap-2 rounded-full border border-[#E7DFD5] bg-white px-3 py-1.5 text-xs text-[#78716C]"
      >
        <Images className="h-3.5 w-3.5 text-[#9A6B2F]" />
        Koleksi foto galeri
      </span>
    );
  }

  return (
    <span
      data-testid="drive-sync-badge"
      className="inline-flex flex-wrap items-center gap-2 rounded-full border border-[#E7DFD5] bg-white px-3 py-1.5 text-xs text-[#78716C]"
    >
      <RefreshCw className="h-3.5 w-3.5 text-[#15803D]" />
      Foto diperbarui otomatis
      {syncedAt && (
        <span className="hidden text-[#A8A29E] sm:inline">• terakhir {formatDateTime(syncedAt)}</span>
      )}
    </span>
  );
}
