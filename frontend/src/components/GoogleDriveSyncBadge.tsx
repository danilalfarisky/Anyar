import { FolderOpen, Images } from "lucide-react";
import { formatDateTime } from "@/lib/format";

interface Props {
  driveFolderUrl: string | null;
  syncedAt: string | null;
}

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
      <span className="h-2 w-2 rounded-full bg-[#15803D]" />
      Terhubung Google Drive
      {syncedAt && <span className="hidden text-[#A8A29E] sm:inline">• sinkron {formatDateTime(syncedAt)}</span>}
      <a
        href={driveFolderUrl}
        target="_blank"
        rel="noreferrer"
        data-testid="gallery-open-drive-btn"
        className="inline-flex items-center gap-1 font-medium text-[#9A6B2F] transition-colors hover:text-[#7D5321]"
      >
        <FolderOpen className="h-3.5 w-3.5" />
        Buka di Drive
      </a>
    </span>
  );
}
