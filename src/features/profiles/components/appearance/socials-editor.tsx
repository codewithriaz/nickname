"use client";

import { Plus, Trash2 } from "lucide-react";
import { SOCIAL_PLATFORMS, type SocialPlatform } from "@/config/social-platforms";
import type { SocialLink } from "@/schemas/profile";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SocialIcon } from "@/components/profile-renderer/social-icon";

export function SocialsEditor({ value, onChange }: { value: SocialLink[]; onChange: (v: SocialLink[]) => void }) {
  const update = (i: number, patch: Partial<SocialLink>) => onChange(value.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  return (
    <div className="space-y-2">
      {value.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
            <SocialIcon platform={s.platform} className="size-4" />
          </span>
          <Select value={s.platform} onChange={(e) => update(i, { platform: e.target.value as SocialPlatform })} className="w-36 shrink-0">
            {SOCIAL_PLATFORMS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </Select>
          <Input value={s.url} onChange={(e) => update(i, { url: e.target.value })} placeholder={SOCIAL_PLATFORMS.find((p) => p.key === s.platform)?.placeholder} />
          <Button variant="ghost" size="icon-sm" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remove">
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...value, { platform: "instagram", url: "" }])}>
        <Plus className="size-4" /> Add social
      </Button>
    </div>
  );
}
