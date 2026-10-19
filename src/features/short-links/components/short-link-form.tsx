"use client";

import { useState } from "react";
import type { ShortLinkDTO } from "@/types/dto";
import type { ShortLinkInput } from "@/schemas/short-link";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ColorInput } from "@/components/ui/color-input";
import { ImageUpload } from "@/components/common/image-upload";
import { useFeature } from "@/features/auth/hooks";
import { toInputDateTime } from "@/lib/dayjs";
import { hostnameOf } from "@/lib/utils";
import { siteConfig } from "@/config/site";

export function ShortLinkForm({ link, onClose, onSubmit, saving }: { link?: ShortLinkDTO | null; onClose: () => void; onSubmit: (v: ShortLinkInput & { removePassword?: boolean }) => void; saving?: boolean }) {
  const canQr = useFeature("customQr");
  const [v, setV] = useState({
    destination: link?.destination ?? "",
    code: link?.code ?? "",
    title: link?.title ?? "",
    password: "",
    removePassword: false,
    expiresAt: toInputDateTime(link?.expiresAt),
    isActive: link?.isActive ?? true,
    utmSource: "",
    utmMedium: "",
    utmCampaign: "",
    fg: link?.qrStyle?.fg ?? "#000000",
    bg: link?.qrStyle?.bg ?? "#ffffff",
    logoUrl: link?.qrStyle?.logoUrl ?? null,
  });
  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => setV((s) => ({ ...s, [k]: val }));

  const submit = () =>
    onSubmit({
      destination: v.destination.trim(),
      code: v.code.trim() || undefined,
      title: v.title,
      password: v.password || undefined,
      removePassword: v.removePassword || undefined,
      expiresAt: v.expiresAt ? new Date(v.expiresAt) : null,
      isActive: v.isActive,
      utm: { source: v.utmSource || undefined, medium: v.utmMedium || undefined, campaign: v.utmCampaign || undefined },
      qrStyle: canQr ? { fg: v.fg, bg: v.bg, logoUrl: v.logoUrl } : undefined,
    });

  return (
    <Dialog
      open
      side="right"
      onClose={onClose}
      title={link ? "Edit short link" : "New short link"}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={saving} disabled={!v.destination}>
            {link ? "Save" : "Create"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Destination URL">
          <Input value={v.destination} onChange={(e) => set("destination", e.target.value)} placeholder="https://facebook.com/marketplace/item/…" />
        </Field>
        <Field label="Custom back-half (optional)" hint={`${hostnameOf(siteConfig.url)}/s/${v.code || "auto"}`}>
          <Input value={v.code} onChange={(e) => set("code", e.target.value.replace(/[^A-Za-z0-9_-]/g, ""))} placeholder="eid-sale" />
        </Field>
        <Field label="Title (for you)">
          <Input value={v.title} onChange={(e) => set("title", e.target.value)} />
        </Field>
        <div className="grid grid-cols-3 gap-2">
          <Field label="utm_source">
            <Input value={v.utmSource} onChange={(e) => set("utmSource", e.target.value)} placeholder="facebook" />
          </Field>
          <Field label="utm_medium">
            <Input value={v.utmMedium} onChange={(e) => set("utmMedium", e.target.value)} placeholder="post" />
          </Field>
          <Field label="utm_campaign">
            <Input value={v.utmCampaign} onChange={(e) => set("utmCampaign", e.target.value)} placeholder="eid" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={link?.hasPassword ? "New password" : "Password (optional)"}>
            <Input type="password" value={v.password} onChange={(e) => set("password", e.target.value)} autoComplete="new-password" />
          </Field>
          <Field label="Expires (optional)">
            <Input type="datetime-local" value={v.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} />
          </Field>
        </div>
        {link?.hasPassword && <Switch label="Remove password" checked={v.removePassword} onCheckedChange={(x) => set("removePassword", x)} />}
        <Switch label="Active" checked={v.isActive} onCheckedChange={(x) => set("isActive", x)} />
        <div className="space-y-3 rounded-2xl border border-border p-3">
          <p className="text-sm font-semibold">QR style {!canQr && <span className="text-xs font-normal text-muted-foreground">(Starter+)</span>}</p>
          {canQr ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Foreground">
                  <ColorInput value={v.fg} onChange={(x) => set("fg", x)} />
                </Field>
                <Field label="Background">
                  <ColorInput value={v.bg} onChange={(x) => set("bg", x)} />
                </Field>
              </div>
              <Field label="Center logo">
                <ImageUpload value={v.logoUrl} onChange={(x) => set("logoUrl", x)} />
              </Field>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Upgrade to customise QR colors and add your logo.</p>
          )}
        </div>
      </div>
    </Dialog>
  );
}
