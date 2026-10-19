"use client";

import { useState } from "react";
import { Lock, Plus, X } from "lucide-react";
import type { TabDTO } from "@/types/dto";
import { useTabMutations } from "../../hooks";
import { useFeature } from "@/features/auth/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function TabsManager({ profileId, tabs }: { profileId: string; tabs: TabDTO[] }) {
  const enabled = useFeature("tabs");
  const { create, remove } = useTabMutations(profileId);
  const [title, setTitle] = useState("");

  if (!enabled) {
    return (
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Lock className="size-3.5" /> Multi-tab pages are available on Starter and Pro.
      </p>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone="dark">Home</Badge>
      {tabs.map((t) => (
        <span key={t.id} className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
          {t.title}
          <button type="button" onClick={() => remove.mutate(t.id)} aria-label={`Delete tab ${t.title}`}>
            <X className="size-3" />
          </button>
        </span>
      ))}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim()) create.mutate(title.trim(), { onSuccess: () => setTitle("") });
        }}
        className="flex items-center gap-1"
      >
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New tab" className="h-8 w-28 text-xs" maxLength={40} />
        <Button type="submit" size="icon-sm" variant="outline" loading={create.isPending} aria-label="Add tab">
          <Plus className="size-4" />
        </Button>
      </form>
    </div>
  );
}
