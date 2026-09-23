import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Image as ImageIcon, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, apiGet, apiPut } from "@/lib/api";
import type { SiteSettings } from "@/lib/types";

function errorDetail(e: unknown): string {
  if (e instanceof ApiError) {
    const body = e.body as { detail?: unknown } | null;
    if (body && typeof body.detail === "string") return body.detail;
  }
  return "Gagal menyimpan — coba lagi";
}

const FIELDS: { key: keyof SiteSettings; label: string; hint?: string }[] = [
  { key: "brand_name", label: "Nama Brand (header & footer)" },
  { key: "hero_overline", label: "Teks Kecil Atas", hint: "cth. MOMENT ALBUM" },
  { key: "hero_date", label: "Tanggal di Hero", hint: "cth. 06 | 09 | 2026" },
  { key: "hero_title", label: "Judul Besar", hint: "cth. Febri & Vini" },
  { key: "hero_cta", label: "Teks Ajakan Scroll", hint: "cth. SCROLL TO MEMORIES" },
  { key: "hero_image_url", label: "URL Foto Hero (potret)" },
  { key: "footer_note", label: "Catatan Footer" },
];

export default function SiteSettingsForm() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<SiteSettings | null>(null);

  const settings = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => apiGet<SiteSettings>("/admin/settings"),
  });

  useEffect(() => {
    if (settings.data && !draft) setDraft(settings.data);
  }, [settings.data, draft]);

  const save = useMutation({
    mutationFn: (body: SiteSettings) => apiPut<SiteSettings>("/admin/settings", body),
    onSuccess: (d) => {
      toast.success("Tampilan beranda diperbarui");
      setDraft(d);
      qc.invalidateQueries({ queryKey: ["settings"] });
      qc.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
    onError: (e) => toast.error(errorDetail(e)),
  });

  return (
    <Card className="border-[var(--line)] bg-[#230C12]">
      <CardHeader>
        <CardTitle className="font-heading text-xl text-[var(--cream)]">
          Tampilan Beranda (Hero)
        </CardTitle>
        <CardDescription className="text-[var(--cream-muted)]">
          Semua teks di halaman pembuka bisa Anda ubah sendiri di sini, termasuk foto hero-nya.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {settings.isPending || !draft ? (
          <div className="space-y-3" data-testid="settings-skeleton">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-[#2E1118]" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {FIELDS.map((f) => (
                <div key={f.key} className="grid gap-2">
                  <Label htmlFor={`setting-${f.key}`} className="text-[var(--cream-muted)]">
                    {f.label}
                  </Label>
                  <Input
                    id={`setting-${f.key}`}
                    data-testid={`settings-${f.key}-input`}
                    value={draft[f.key]}
                    onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                    placeholder={f.hint}
                    className="border-[var(--line)] bg-[#150609] text-[var(--cream)]"
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <div className="h-20 w-16 overflow-hidden rounded-lg border border-[var(--line)] bg-[#2E1118]">
                {draft.hero_image_url ? (
                  <img
                    src={draft.hero_image_url}
                    alt="Pratinjau hero"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[var(--gold)]/60">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                )}
              </div>
              <Button
                data-testid="settings-save-btn"
                onClick={() => save.mutate(draft)}
                disabled={save.isPending}
                className="bg-[var(--maroon)] text-[var(--cream)] hover:bg-[#A82A3E]"
              >
                <Save className="h-4 w-4" />
                {save.isPending ? "Menyimpan…" : "Simpan Tampilan"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
