"use client";

import { useMemo, useState } from "react";
import { Crown, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import type { ProfileDTO } from "@/types/dto";
import type { ProfileTheme } from "@/schemas/theme";
import type { SocialLink } from "@/schemas/profile";
import { resolveTheme } from "@/schemas/theme";
import { useActiveProfileId, useProfile, useTemplates, useUpdateProfile } from "../../hooks";
import { useFeature } from "@/features/auth/hooks";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/ui/skeleton";
import { ImageUpload } from "@/components/common/image-upload";
import { TemplateThumb } from "@/components/common/template-thumb";
import { LivePreview } from "../live-preview";
import { ThemeEditor } from "@/components/common/theme-editor";
import { SocialsEditor } from "./socials-editor";
import { cn } from "@/lib/utils";

export function AppearanceView() {
  const { profileId } = useActiveProfileId();
  const { data: profile } = useProfile(profileId);
  if (!profile) return <PageLoader />;
  return <Editor key={profile.id} profile={profile} />;
}

type Draft = { displayName: string; bio: string; avatarUrl: string | null; socials: SocialLink[]; templateId: string | null; theme: ProfileTheme; themeDirty: boolean };

function Editor({ profile }: { profile: ProfileDTO }) {
  const { data: templates = [] } = useTemplates();
  const update = useUpdateProfile(profile.id);
  const premiumOk = useFeature("premiumTemplates");
  const [d, setD] = useState<Draft>({
    displayName: profile.displayName,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
    socials: profile.socials,
    templateId: profile.templateId,
    theme: profile.resolvedTheme,
    themeDirty: !!profile.theme && Object.keys(profile.theme).length > 0,
  });

  const override = useMemo<Partial<ProfileDTO>>(
    () => ({ displayName: d.displayName, bio: d.bio, avatarUrl: d.avatarUrl, socials: d.socials.filter((s) => s.url), resolvedTheme: d.theme }),
    [d],
  );

  const pickTemplate = (id: string) => {
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setD((s) => ({ ...s, templateId: id, theme: t.theme, themeDirty: false }));
  };

  const save = () => {
    const invalidSocial = d.socials.find((s) => s.url && !/^(https?:\/\/|mailto:|tel:)/i.test(s.url));
    if (invalidSocial) return toast.error(`Social link for ${invalidSocial.platform} must start with https://`);
    update.mutate(
      {
        displayName: d.displayName,
        bio: d.bio,
        avatarUrl: d.avatarUrl ?? "",
        socials: d.socials.filter((s) => s.url),
        templateId: d.templateId,
        // store full theme as override only when customised away from the template
        theme: d.themeDirty ? d.theme : null,
      },
      { onSuccess: () => toast.success("Appearance saved") },
    );
  };

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        <PageHeader
          title="Appearance"
          description="Profile info, templates and your custom design."
          actions={
            <Button onClick={save} loading={update.isPending}>
              Save changes
            </Button>
          }
        />
        <Card>
          <CardHeader title="Profile" />
          <CardBody className="space-y-4">
            <ImageUpload value={d.avatarUrl} onChange={(avatarUrl) => setD((s) => ({ ...s, avatarUrl }))} aspect="avatar" label="Upload photo / logo" />
            <Field label="Display name">
              <Input value={d.displayName} onChange={(e) => setD((s) => ({ ...s, displayName: e.target.value }))} maxLength={60} />
            </Field>
            <Field label="Bio" hint={`${d.bio.length}/300`}>
              <Textarea value={d.bio} onChange={(e) => setD((s) => ({ ...s, bio: e.target.value }))} maxLength={300} />
            </Field>
            <Field label="Social icons">
              <SocialsEditor value={d.socials} onChange={(socials) => setD((s) => ({ ...s, socials }))} />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Templates" description="Start from a template, then customise below." />
          <CardBody>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {templates.map((t) => {
                const locked = t.isPremium && !premiumOk;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => (locked ? toast.info("Premium template — upgrade to Starter to use it") : pickTemplate(t.id))}
                    className={cn("group relative overflow-hidden rounded-2xl ring-2 transition", d.templateId === t.id ? "ring-primary" : "ring-transparent hover:ring-border")}
                  >
                    <TemplateThumb theme={t.theme} />
                    <span className="block bg-white py-1.5 text-xs font-medium">{t.name}</span>
                    {t.isPremium && (
                      <Badge tone="warning" className="absolute right-1.5 top-1.5">
                        <Crown className="size-3" /> Pro
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Customise"
            description="Fine-tune colors, fonts and buttons."
            action={
              d.themeDirty && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const t = templates.find((x) => x.id === d.templateId);
                    setD((s) => ({ ...s, theme: resolveTheme(t?.theme), themeDirty: false }));
                  }}
                >
                  <RotateCcw className="size-4" /> Reset to template
                </Button>
              )
            }
          />
          <CardBody>
            <ThemeEditor theme={d.theme} onChange={(theme) => setD((s) => ({ ...s, theme, themeDirty: true }))} />
          </CardBody>
        </Card>
      </div>
      <aside className="hidden xl:block">
        <div className="sticky top-20">
          <LivePreview profileId={profile.id} profileOverride={override} />
        </div>
      </aside>
    </div>
  );
}
