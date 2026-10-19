"use client";

import { Plus, Trash2 } from "lucide-react";
import type { StoreLayout, StoreSlide } from "@/schemas/shop";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ColorInput } from "@/components/ui/color-input";
import { ImageUpload } from "@/components/common/image-upload";
import { cn } from "@/lib/utils";

export type DesignDraft = {
  layout: StoreLayout;
  brandColor: string;
  announcement: string;
  heroSlides: StoreSlide[];
  promoBanners: StoreSlide[];
};

const LAYOUTS: { value: StoreLayout; name: string; description: string }[] = [
  { value: "minimal", name: "Minimal", description: "Clean mobile shop using your page theme — perfect for a few products." },
  { value: "megastore", name: "Mega store", description: "Full e-commerce look: announcement bar, search, category menu, banner slider, category sections, footer." },
];

function LayoutPreview({ layout, color }: { layout: StoreLayout; color: string }) {
  if (layout === "minimal") {
    return (
      <div className="flex h-28 flex-col gap-1.5 rounded-xl bg-gradient-to-b from-violet-50 to-pink-50 p-2">
        <div className="h-2 w-16 rounded bg-zinc-300" />
        <div className="grid flex-1 grid-cols-2 gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-md bg-white shadow-sm" />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-28 flex-col gap-1 overflow-hidden rounded-xl bg-zinc-50 p-1.5">
      <div className="h-1.5 rounded-sm" style={{ background: color }} />
      <div className="flex gap-1">
        <div className="h-2 w-6 rounded-sm bg-zinc-300" />
        <div className="h-2 flex-1 rounded-full bg-white ring-1 ring-zinc-200" />
      </div>
      <div className="h-7 rounded-md bg-gradient-to-r from-amber-200 to-orange-300" />
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="size-3.5 rounded bg-white ring-1 ring-zinc-200" />
        ))}
      </div>
      <div className="grid flex-1 grid-cols-5 gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-sm bg-white ring-1 ring-zinc-200" />
        ))}
      </div>
    </div>
  );
}

function SlidesEditor({ value, onChange, max, label, aspect }: { value: StoreSlide[]; onChange: (v: StoreSlide[]) => void; max: number; label: string; aspect: string }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">
        {label} <span className="text-xs font-normal text-muted-foreground">({aspect})</span>
      </p>
      {value.map((s, i) => (
        <div key={i} className="grid gap-2 rounded-2xl border border-border p-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
          <ImageUpload value={s.imageUrl} onChange={(u) => onChange(u ? value.map((x, j) => (j === i ? { ...x, imageUrl: u } : x)) : value.filter((_, j) => j !== i))} aspect="wide" />
          <div className="space-y-2">
            <Input value={s.title ?? ""} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} placeholder="Title (optional)" />
            <Input value={s.linkUrl ?? ""} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, linkUrl: e.target.value } : x)))} placeholder="Link (optional) e.g. /yourname/shop/all?category=saree" />
          </div>
          <Button variant="ghost" size="icon" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remove">
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ))}
      {value.length < max && (
        <AddSlide onAdd={(url) => onChange([...value, { imageUrl: url }])} />
      )}
    </div>
  );
}

function AddSlide({ onAdd }: { onAdd: (url: string) => void }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border p-3">
      <Plus className="size-4 text-muted-foreground" />
      <ImageUpload value={null} onChange={(u) => u && onAdd(u)} label="Upload banner image" />
    </div>
  );
}

export function DesignSettings({ d, set }: { d: DesignDraft; set: (patch: Partial<DesignDraft>) => void }) {
  return (
    <Card>
      <CardHeader title="Shop design" description="Pick a storefront template. You can switch any time." />
      <CardBody className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          {LAYOUTS.map((l) => (
            <button
              key={l.value}
              type="button"
              onClick={() => set({ layout: l.value })}
              className={cn("rounded-2xl border-2 p-3 text-left transition", d.layout === l.value ? "border-primary bg-primary-soft/30" : "border-border hover:border-primary/40")}
            >
              <LayoutPreview layout={l.value} color={d.brandColor} />
              <p className="mt-2 text-sm font-semibold">{l.name}</p>
              <p className="text-xs text-muted-foreground">{l.description}</p>
            </button>
          ))}
        </div>
        {d.layout === "megastore" && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Brand color">
                <ColorInput value={d.brandColor} onChange={(brandColor) => set({ brandColor })} />
              </Field>
              <Field label="Announcement bar (optional)">
                <Input value={d.announcement} onChange={(e) => set({ announcement: e.target.value })} placeholder="Free delivery over ৳2000 · Cash on delivery all over Bangladesh" maxLength={200} />
              </Field>
            </div>
            <SlidesEditor label="Hero banner slider" aspect="recommended 1600×600" value={d.heroSlides} onChange={(heroSlides) => set({ heroSlides })} max={6} />
            <SlidesEditor label="Promo banners (up to 3)" aspect="recommended 800×400" value={d.promoBanners} onChange={(promoBanners) => set({ promoBanners })} max={3} />
            <p className="text-xs text-muted-foreground">Tip: add category pictures in Products → categories to show the category carousel.</p>
          </>
        )}
      </CardBody>
    </Card>
  );
}
