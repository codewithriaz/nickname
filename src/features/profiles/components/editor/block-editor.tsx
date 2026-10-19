"use client";

import { useState } from "react";
import { Lock, Plus, Trash2 } from "lucide-react";
import type { BlockDTO, TabDTO } from "@/types/dto";
import type { BlockAnimation, BlockLayout } from "@/generated/prisma/enums";
import type { FormField, UpdateBlockInput } from "@/schemas/block";
import { FORM_FIELD_TYPES } from "@/schemas/block";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { FileUpload, ImageUpload } from "@/components/common/image-upload";
import { useFeature } from "@/features/auth/hooks";
import { useProducts, useStore } from "@/features/shop/hooks";
import { toInputDateTime } from "@/lib/dayjs";
import { BLOCK_TYPE_META } from "./block-meta";

const LAYOUTS: BlockLayout[] = ["CLASSIC", "HIGHLIGHT", "GRID", "CAROUSEL"];
const ANIMATIONS: BlockAnimation[] = ["NONE", "PULSE", "SHAKE", "BOUNCE", "WOBBLE", "GLOW", "JIGGLE", "FLASH"];

type Draft = {
  title: string;
  url: string;
  data: Record<string, unknown>;
  thumbnail: BlockDTO["thumbnail"];
  layout: BlockLayout;
  animation: BlockAnimation;
  startsAt: string;
  endsAt: string;
  tabId: string | null;
  parentId: string | null;
};

const toDraft = (b: BlockDTO): Draft => ({
  title: b.title,
  url: b.url ?? "",
  data: b.data,
  thumbnail: b.thumbnail,
  layout: b.layout,
  animation: b.animation,
  startsAt: toInputDateTime(b.startsAt),
  endsAt: toInputDateTime(b.endsAt),
  tabId: b.tabId,
  parentId: b.parentId,
});

/** Slide-over editor for one block. Keeps a local draft → single save (no re-render storms on keystrokes). */
export function BlockEditor({
  block,
  profileId,
  tabs,
  folders,
  onClose,
  onSave,
  saving,
}: {
  block: BlockDTO;
  profileId: string;
  tabs: TabDTO[];
  folders: BlockDTO[];
  onClose: () => void;
  onSave: (body: UpdateBlockInput) => void;
  saving?: boolean;
}) {
  const [d, setD] = useState<Draft>(() => toDraft(block));
  const canSchedule = useFeature("scheduling");
  const canTabs = useFeature("tabs");
  const { data: store } = useStore(profileId);
  const { data: products } = useProducts(store?.id);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((s) => ({ ...s, [k]: v }));
  const setData = (k: string, v: unknown) => setD((s) => ({ ...s, data: { ...s.data, [k]: v } }));
  const str = (k: string) => (typeof d.data[k] === "string" ? (d.data[k] as string) : "");
  const bool = (k: string) => d.data[k] === true;

  const isLinkish = ["LINK", "AFFILIATE"].includes(block.type);
  const needsUrl = ["LINK", "AFFILIATE", "EMBED", "FILE"].includes(block.type);

  const save = () =>
    onSave({
      title: d.title,
      url: needsUrl ? d.url : undefined,
      data: d.data,
      thumbnail: d.thumbnail,
      layout: d.layout,
      animation: d.animation,
      startsAt: d.startsAt ? new Date(d.startsAt) : null,
      endsAt: d.endsAt ? new Date(d.endsAt) : null,
      tabId: d.tabId,
      parentId: block.type === "FOLDER" ? undefined : d.parentId,
      ...(needsUrl && d.url && !block.isActive && !block.url ? { isActive: true } : {}),
    });

  const fields = (Array.isArray(d.data.fields) ? d.data.fields : []) as FormField[];

  return (
    <Dialog
      open
      side="right"
      onClose={onClose}
      title={`Edit ${BLOCK_TYPE_META[block.type].label.toLowerCase()}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {block.type !== "DIVIDER" && block.type !== "SOCIALS" && (
          <Field label={block.type === "HEADER" ? "Heading" : "Title"}>
            <Input value={d.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Shop my new collection" />
          </Field>
        )}

        {needsUrl && (
          <Field
            label={block.type === "EMBED" ? "Video / music URL" : block.type === "FILE" ? "File" : "URL"}
            hint={block.type === "EMBED" ? "YouTube, Vimeo, Spotify, SoundCloud, TikTok or Facebook video link" : undefined}
          >
            <Input value={d.url} onChange={(e) => set("url", e.target.value)} placeholder="https://" />
            {block.type === "FILE" && (
              <div className="pt-1">
                <FileUpload
                  onUploaded={(r) => {
                    set("url", r.url);
                    setData("fileName", r.name);
                  }}
                />
              </div>
            )}
          </Field>
        )}

        {/* ── Type-specific ── */}
        {isLinkish && (
          <Field label="Description (optional)">
            <Input value={str("description")} onChange={(e) => setData("description", e.target.value)} />
          </Field>
        )}
        {block.type === "LINK" && (
          <Field label="Badge label (optional)" hint="Small tag like NEW or SALE">
            <Input value={str("highlightLabel")} onChange={(e) => setData("highlightLabel", e.target.value)} maxLength={30} />
          </Field>
        )}
        {block.type === "AFFILIATE" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Disclosure">
              <Input value={str("disclosure") || "Affiliate link"} onChange={(e) => setData("disclosure", e.target.value)} />
            </Field>
            <Field label="Coupon code">
              <Input value={str("couponCode")} onChange={(e) => setData("couponCode", e.target.value)} />
            </Field>
            <Field label="Network (optional)" className="col-span-2">
              <Input value={str("network")} onChange={(e) => setData("network", e.target.value)} placeholder="Daraz, Amazon, ShareASale…" />
            </Field>
          </div>
        )}
        {(block.type === "HEADER" || block.type === "TEXT") && (
          <Field label="Alignment">
            <Segmented value={(str("align") || "center") as "left" | "center"} onChange={(v) => setData("align", v)} options={[{ value: "center", label: "Center" }, { value: "left", label: "Left" }]} />
          </Field>
        )}
        {block.type === "TEXT" && (
          <Field label="Text">
            <Textarea rows={6} value={str("text")} onChange={(e) => setData("text", e.target.value)} />
          </Field>
        )}
        {block.type === "IMAGE" && (
          <>
            <ImageUpload value={str("imageUrl") || null} onChange={(u) => setData("imageUrl", u ?? "")} aspect="wide" />
            <Field label="Alt text">
              <Input value={str("alt")} onChange={(e) => setData("alt", e.target.value)} />
            </Field>
            <Field label="Link when tapped (optional)">
              <Input value={str("linkUrl")} onChange={(e) => setData("linkUrl", e.target.value)} placeholder="https://" />
            </Field>
          </>
        )}
        {(block.type === "EMAIL_SIGNUP" || block.type === "FORM") && (
          <>
            <Field label="Description">
              <Input value={str("description")} onChange={(e) => setData("description", e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Button label">
                <Input value={str("buttonLabel")} onChange={(e) => setData("buttonLabel", e.target.value)} />
              </Field>
              <Field label="Success message">
                <Input value={str("successMessage")} onChange={(e) => setData("successMessage", e.target.value)} />
              </Field>
            </div>
          </>
        )}
        {block.type === "EMAIL_SIGNUP" && (
          <div className="space-y-3 rounded-2xl border border-border p-3">
            <Switch label="Ask for name" checked={bool("collectName")} onCheckedChange={(v) => setData("collectName", v)} />
            <Switch label="Ask for phone" checked={bool("collectPhone")} onCheckedChange={(v) => setData("collectPhone", v)} />
          </div>
        )}
        {block.type === "FORM" && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Fields</p>
            {fields.map((f, i) => (
              <div key={f.id} className="flex items-center gap-2">
                <Input
                  value={f.label}
                  onChange={(e) => setData("fields", fields.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                  placeholder="Label"
                />
                <Select value={f.type} onChange={(e) => setData("fields", fields.map((x, j) => (j === i ? { ...x, type: e.target.value as FormField["type"] } : x)))} className="w-32">
                  {FORM_FIELD_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </Select>
                <label className="flex items-center gap-1 text-xs">
                  <input type="checkbox" checked={f.required} onChange={(e) => setData("fields", fields.map((x, j) => (j === i ? { ...x, required: e.target.checked } : x)))} /> Req.
                </label>
                <Button variant="ghost" size="icon-sm" onClick={() => setData("fields", fields.filter((_, j) => j !== i))} aria-label="Remove field">
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            {fields.some((f) => f.type === "select") && <p className="text-xs text-muted-foreground">Select options: edit after saving via comma list below.</p>}
            {fields.map(
              (f, i) =>
                f.type === "select" && (
                  <Field key={`${f.id}-opts`} label={`Options for "${f.label}"`}>
                    <Input
                      value={(f.options ?? []).join(", ")}
                      onChange={(e) => setData("fields", fields.map((x, j) => (j === i ? { ...x, options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) } : x)))}
                    />
                  </Field>
                ),
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setData("fields", [...fields, { id: `f${Date.now().toString(36)}`, label: "Field", type: "text", required: false }])}
            >
              <Plus className="size-4" /> Add field
            </Button>
          </div>
        )}
        {block.type === "PRODUCT" && (
          <Field label="Product" hint={!store ? "Create your shop first (Shop → Overview)" : undefined}>
            <Select value={str("productId")} onChange={(e) => setData("productId", e.target.value)}>
              <option value="">Select a product</option>
              {(products ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
        {block.type === "SOCIALS" && (
          <Field label="Icon size" hint="Edit your social accounts in Appearance → Profile">
            <Segmented value={(str("size") || "md") as "sm" | "md" | "lg"} onChange={(v) => setData("size", v)} options={[{ value: "sm", label: "Small" }, { value: "md", label: "Medium" }, { value: "lg", label: "Large" }]} />
          </Field>
        )}
        {block.type === "DIVIDER" && (
          <Field label="Style">
            <Segmented value={(str("style") || "line") as "line" | "space" | "dots"} onChange={(v) => setData("style", v)} options={[{ value: "line", label: "Line" }, { value: "dots", label: "Dots" }, { value: "space", label: "Space" }]} />
          </Field>
        )}
        {block.type === "FOLDER" && <Switch label="Open by default" checked={bool("defaultOpen")} onCheckedChange={(v) => setData("defaultOpen", v)} />}

        {/* ── Appearance ── */}
        {(isLinkish || block.type === "FOLDER") && (
          <div className="space-y-3 rounded-2xl bg-muted/60 p-3">
            <p className="text-sm font-semibold">Look</p>
            <Field label="Thumbnail">
              <Segmented
                size="sm"
                value={d.thumbnail?.kind ?? "none"}
                onChange={(k) => set("thumbnail", k === "none" ? null : { kind: k as "emoji" | "image", value: d.thumbnail?.value ?? (k === "emoji" ? "🔥" : "") })}
                options={[{ value: "none", label: "None" }, { value: "emoji", label: "Emoji" }, { value: "image", label: "Image" }]}
              />
            </Field>
            {d.thumbnail?.kind === "emoji" && <Input value={d.thumbnail.value} onChange={(e) => set("thumbnail", { kind: "emoji", value: e.target.value })} maxLength={8} className="w-24 text-center text-xl" />}
            {d.thumbnail?.kind === "image" && <ImageUpload value={d.thumbnail.value || null} onChange={(u) => set("thumbnail", u ? { kind: "image", value: u } : null)} />}
            {isLinkish && (
              <Field label="Layout" hint="Grid / carousel group with neighbouring blocks of the same layout">
                <Select value={d.layout} onChange={(e) => set("layout", e.target.value as BlockLayout)}>
                  {LAYOUTS.map((l) => (
                    <option key={l} value={l}>
                      {l.charAt(0) + l.slice(1).toLowerCase()}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            <Field label="Animation">
              <Select value={d.animation} onChange={(e) => set("animation", e.target.value as BlockAnimation)}>
                {ANIMATIONS.map((a) => (
                  <option key={a} value={a}>
                    {a.charAt(0) + a.slice(1).toLowerCase()}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        )}

        {/* ── Placement ── */}
        {block.type !== "FOLDER" && folders.length > 0 && isLinkish && (
          <Field label="Inside folder">
            <Select value={d.parentId ?? ""} onChange={(e) => set("parentId", e.target.value || null)}>
              <option value="">— None —</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.title || "Folder"}
                </option>
              ))}
            </Select>
          </Field>
        )}
        {canTabs && tabs.length > 0 && (
          <Field label="Tab">
            <Select value={d.tabId ?? ""} onChange={(e) => set("tabId", e.target.value || null)}>
              <option value="">Home</option>
              {tabs.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </Select>
          </Field>
        )}

        {/* ── Schedule ── */}
        <div className="space-y-3 rounded-2xl border border-border p-3">
          <p className="flex items-center gap-2 text-sm font-semibold">
            Schedule {!canSchedule && <Lock className="size-3.5 text-muted-foreground" />}
          </p>
          {canSchedule ? (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Show from">
                <Input type="datetime-local" value={d.startsAt} onChange={(e) => set("startsAt", e.target.value)} />
              </Field>
              <Field label="Hide after">
                <Input type="datetime-local" value={d.endsAt} onChange={(e) => set("endsAt", e.target.value)} />
              </Field>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Upgrade to Starter to schedule when blocks appear and disappear.</p>
          )}
        </div>
      </div>
    </Dialog>
  );
}
