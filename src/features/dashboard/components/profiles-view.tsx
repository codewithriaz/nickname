"use client";

import { useState } from "react";
import { ExternalLink, Plus } from "lucide-react";
import { useActiveProfileId } from "@/features/profiles/hooks";
import { useMe } from "@/features/auth/hooks";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Dialog } from "@/components/ui/dialog";
import { routes } from "@/config/site";
import { CreateProfileCard } from "./create-profile-card";

export function ProfilesView() {
  const { profiles, profileId } = useActiveProfileId();
  const setActive = useWorkspaceStore((s) => s.setActiveProfileId);
  const { data: me } = useMe();
  const [creating, setCreating] = useState(false);
  const limit = me?.plan.limits.profiles ?? 1;

  return (
    <>
      <PageHeader
        title="Profiles"
        description={`Manage multiple pages from one account · ${profiles.length}/${limit < 0 ? "∞" : limit} used`}
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" /> New profile
          </Button>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {profiles.map((p) => (
          <Card key={p.id} className="flex items-center gap-3 p-4">
            <Avatar src={p.avatarUrl} name={p.displayName} className="size-12" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{p.displayName}</p>
              <p className="truncate text-sm text-muted-foreground">@{p.username}</p>
              <div className="mt-1 flex gap-1">
                {p.id === profileId && <Badge tone="primary">Editing</Badge>}
                {p.hasStore && <Badge>Shop</Badge>}
                {!p.isPublished && <Badge tone="dark">Unpublished</Badge>}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              {p.id !== profileId && (
                <Button size="sm" variant="outline" onClick={() => setActive(p.id)}>
                  Switch
                </Button>
              )}
              <a href={routes.profile(p.username)} target="_blank" rel="noopener" className="flex items-center justify-center gap-1 text-xs text-primary">
                Open <ExternalLink className="size-3" />
              </a>
            </div>
          </Card>
        ))}
      </div>
      <Dialog open={creating} onClose={() => setCreating(false)} title="New profile">
        <CreateProfileCard onCreated={() => setCreating(false)} />
      </Dialog>
    </>
  );
}
