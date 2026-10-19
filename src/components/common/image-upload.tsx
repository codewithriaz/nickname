"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { uploadApi, type UploadResult } from "@/features/uploads/api";
import { toApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

/** Single image picker with upload + preview. Value is the stored URL. */
export function ImageUpload({
  value,
  onChange,
  className,
  aspect = "square",
  label = "Upload image",
}: {
  value?: string | null;
  onChange: (url: string | null) => void;
  className?: string;
  aspect?: "square" | "wide" | "avatar";
  label?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);

  const pick = async (file?: File) => {
    if (!file) return;
    setProgress(0);
    try {
      const res = await uploadApi.file(file, "images", setProgress);
      onChange(res.url);
    } catch (e) {
      toast.error(toApiError(e).message);
    } finally {
      setProgress(null);
      if (input.current) input.current.value = "";
    }
  };

  const shape = aspect === "wide" ? "aspect-[3/1] w-full" : aspect === "avatar" ? "size-20 rounded-full" : "size-24";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <button
        type="button"
        onClick={() => input.current?.click()}
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-input bg-muted text-muted-foreground hover:border-primary",
          shape,
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <ImagePlus className="size-6" />
        )}
        {progress !== null && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs font-semibold text-white">
            <Loader2 className="mr-1 size-4 animate-spin" /> {progress}%
          </span>
        )}
      </button>
      <div className="flex flex-col gap-1.5">
        <button type="button" onClick={() => input.current?.click()} className="flex items-center gap-1.5 text-sm font-medium text-primary">
          <Upload className="size-4" /> {label}
        </button>
        {value && (
          <button type="button" onClick={() => onChange(null)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive">
            <Trash2 className="size-3.5" /> Remove
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" hidden onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  );
}

/** Multiple images (product gallery). */
export function MultiImageUpload({ value, onChange, max = 8 }: { value: string[]; onChange: (urls: string[]) => void; max?: number }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const pick = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const uploaded: UploadResult[] = [];
      for (const f of Array.from(files).slice(0, max - value.length)) uploaded.push(await uploadApi.file(f, "images"));
      onChange([...value, ...uploaded.map((u) => u.url)]);
    } catch (e) {
      toast.error(toApiError(e).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };
  return (
    <div className="flex flex-wrap gap-2">
      {value.map((url, i) => (
        <div key={url} className="group relative size-20 overflow-hidden rounded-xl border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="size-full object-cover" />
          {i === 0 && <span className="absolute left-1 top-1 rounded bg-black/60 px-1 text-[9px] font-semibold text-white">Cover</span>}
          <button
            type="button"
            onClick={() => onChange(value.filter((v) => v !== url))}
            className="absolute right-1 top-1 hidden rounded-md bg-black/60 p-1 text-white group-hover:block"
            aria-label="Remove image"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      ))}
      {value.length < max && (
        <button type="button" onClick={() => input.current?.click()} className="flex size-20 items-center justify-center rounded-xl border-2 border-dashed border-input text-muted-foreground hover:border-primary">
          {busy ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
        </button>
      )}
      <input ref={input} type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif,image/avif" hidden onChange={(e) => pick(e.target.files)} />
    </div>
  );
}

/** Generic file upload (PDF, zip, mp3) — returns URL. */
export function FileUpload({ onUploaded, label = "Upload file" }: { onUploaded: (r: UploadResult) => void; label?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button type="button" onClick={() => input.current?.click()} className="flex items-center gap-1.5 text-sm font-medium text-primary" disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} {label}
      </button>
      <input
        ref={input}
        type="file"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setBusy(true);
          try {
            onUploaded(await uploadApi.file(f, "files"));
          } catch (err) {
            toast.error(toApiError(err).message);
          } finally {
            setBusy(false);
          }
        }}
      />
    </>
  );
}
