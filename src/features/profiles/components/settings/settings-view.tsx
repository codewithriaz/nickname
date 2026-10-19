"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Globe, Lock } from "lucide-react";
import { toast } from "sonner";
import type { ProfileDTO } from "@/types/dto";
import type { ProfileSettings, ProfileSeo } from "@/schemas/profile";
import type { PlanFeatureKey } from "@/schemas/plan";
import { useActiveProfileId, useBlocks, useDeleteProfile, useProfile, useUpdateProfile } from "../../hooks";
import { profilesApi } from "../../api";
import { useFeature } from "@/features/auth/hooks";
import { qk } from "@/lib/query-keys";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { PageLoader } from "@/components/ui/skeleton";
import { useConfirm } from "@/components/ui/confirm";
import { ImageUpload } from "@/components/common/image-upload";
import { absoluteUrl, routes, siteConfig } from "@/config/site";
import { toInputDateTime } from "@/lib/dayjs";
import { hostnameOf } from "@/lib/utils";
import type { ApiError } from "@/lib/api/types";

export function SettingsView() {
  const { profileId } = useActiveProfileId();
  const { data: profile } = useProfile(profileId);
  if (!profile) return <PageLoader />;
  return <Sections key={profile.id} profile={profile} />;
}

function Gate({ feature, children, label }: { feature: PlanFeatureKey; children: ReactNode; label: string }) {
  const ok = useFeature(feature);
  if (ok) return <>{children}</>;
  return (
    <p className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2.5 text-sm text-muted-foreground">
      <Lock className="size-4" /> {label} — <Link href="/dashboard/billing" className="font-semibold text-primary">upgrade</Link>
    </p>
  );
}

function Sections({ profile }: { profile: ProfileDTO }) {
  const update = useUpdateProfile(profile.id);
  const qc = useQueryClient();
  const { data: blocks = [] } = useBlocks(profile.id);
  const del = useDeleteProfile();
  const [confirmDialog, confirm] = useConfirm();

  const [username, setUsername] = useState(profile.username);
  const [settings, setSettings] = useState<ProfileSettings>(profile.settings);
  const [seo, setSeo] = useState<ProfileSeo>(profile.seo);
  const [redirect, setRedirect] = useState({
    blockId: profile.redirectBlockId ?? "",
    start: toInputDateTime(profile.redirectStartsAt),
    end: toInputDateTime(profile.redirectEndsAt),
  });
  const [domain, setDomain] = useState(profile.customDomain ?? "");
  const setS = <K extends keyof ProfileSettings>(k: K, v: ProfileSettings[K]) => setSettings((s) => ({ ...s, [k]: v }));
  const saved = () => toast.success("Saved");

  const domainMut = useMutation<ProfileDTO, ApiError, string | null>({
    mutationFn: (value) => profilesApi.setDomain(profile.id, value),
    onSuccess: (p) => {
      qc.setQueryData(qk.profile(p.id), p);
      toast.success(p.customDomain ? "Domain saved — add the DNS records below" : "Domain removed");
    },
    onError: (e) => toast.error(e.message),
  });
  const verifyMut = useMutation<{ verified: boolean; profile: ProfileDTO }, ApiError>({
    mutationFn: () => profilesApi.verifyDomain(profile.id),
    onSuccess: (r) => {
      qc.setQueryData(qk.profile(profile.id), r.profile);
      if (r.verified) toast.success("Domain verified 🎉");
      else toast.error("TXT record not found yet. DNS can take up to 24h.");
    },
    onError: (e) => toast.error(e.message),
  });
  const verificationMut = useMutation<ProfileDTO, ApiError>({
    mutationFn: () => profilesApi.requestVerification(profile.id),
    onSuccess: (p) => {
      qc.setQueryData(qk.profile(p.id), p);
      toast.success("Verification requested");
    },
    onError: (e) => toast.error(e.message),
  });

  const linkBlocks = blocks.filter((b) => b.url && ["LINK", "AFFILIATE"].includes(b.type));
  const appHost = hostnameOf(siteConfig.url);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title="Page settings" description={`Settings for @${profile.username}`} />

      <Card>
        <CardHeader title="Address & visibility" />
        <CardBody className="space-y-4">
          <Field label="Username" hint={absoluteUrl(routes.profile(username || profile.username))}>
            <div className="flex gap-2">
              <Input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} />
              <Button variant="outline" disabled={username === profile.username} loading={update.isPending} onClick={() => update.mutate({ username }, { onSuccess: saved })}>
                Change
              </Button>
            </div>
          </Field>
          <Switch label="Page is published" description="Unpublished pages show a 404 to visitors." checked={profile.isPublished} onCheckedChange={(isPublished) => update.mutate({ isPublished }, { onSuccess: saved })} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Page options" />
        <CardBody className="space-y-4">
          <Switch label="Share button" description="QR code, copy link & save contact (vCard)" checked={settings.showShare} onCheckedChange={(v) => setS("showShare", v)} />
          <Switch label="Search bar" description="Let visitors search your links" checked={settings.showSearch} onCheckedChange={(v) => setS("showSearch", v)} />
          <Field label="Social icons position">
            <Select value={settings.socialsPosition} onChange={(e) => setS("socialsPosition", e.target.value as "top" | "bottom")}>
              <option value="top">Top (under bio)</option>
              <option value="bottom">Bottom</option>
            </Select>
          </Field>
          <Switch label="Sensitive content warning" description="Visitors confirm they are 18+ before viewing" checked={settings.sensitive} onCheckedChange={(v) => setS("sensitive", v)} />
          {settings.sensitive && <Input value={settings.sensitiveMessage ?? ""} onChange={(e) => setS("sensitiveMessage", e.target.value)} placeholder="Custom warning message (optional)" />}
          <Gate feature="removeBranding" label="Remove branding">
            <Switch label={`Hide "Made with ${siteConfig.name}"`} checked={settings.hideBranding} onCheckedChange={(v) => setS("hideBranding", v)} />
          </Gate>
          <Field label="Footer text">
            <Input value={settings.footerText ?? ""} onChange={(e) => setS("footerText", e.target.value)} maxLength={120} placeholder="© 2026 My Brand" />
          </Field>
          <Field label="Footer logo">
            <ImageUpload value={settings.footerLogoUrl} onChange={(u) => setS("footerLogoUrl", u)} />
          </Field>
          <Button onClick={() => update.mutate({ settings }, { onSuccess: saved })} loading={update.isPending}>
            Save options
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="SEO & social preview" description="How your page appears on Google, Facebook and WhatsApp." />
        <CardBody className="space-y-4">
          <Gate feature="customSeo" label="Custom SEO & social preview">
            <Field label="Page title">
              <Input value={seo.title ?? ""} onChange={(e) => setSeo((s) => ({ ...s, title: e.target.value }))} maxLength={70} />
            </Field>
            <Field label="Description">
              <Textarea value={seo.description ?? ""} onChange={(e) => setSeo((s) => ({ ...s, description: e.target.value }))} maxLength={200} />
            </Field>
            <Field label="Social share image">
              <ImageUpload value={seo.ogImage} onChange={(ogImage) => setSeo((s) => ({ ...s, ogImage }))} aspect="wide" />
            </Field>
            <Button onClick={() => update.mutate({ seo }, { onSuccess: saved })} loading={update.isPending}>
              Save SEO
            </Button>
          </Gate>
          <Field label="Pinterest verification code" hint="Content of the p:domain_verify meta tag">
            <div className="flex gap-2">
              <Input value={settings.pinterestVerify ?? ""} onChange={(e) => setS("pinterestVerify", e.target.value)} />
              <Button variant="outline" onClick={() => update.mutate({ settings: { pinterestVerify: settings.pinterestVerify } }, { onSuccess: saved })}>
                Save
              </Button>
            </div>
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Tracking pixels" description="Facebook Pixel & Google Analytics on your page and shop." />
        <CardBody>
          <Gate feature="pixels" label="Facebook Pixel & Google Analytics">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Facebook Pixel ID">
                <Input value={settings.fbPixelId ?? ""} onChange={(e) => setS("fbPixelId", e.target.value.trim())} placeholder="123456789012345" />
              </Field>
              <Field label="Google Analytics ID">
                <Input value={settings.gaId ?? ""} onChange={(e) => setS("gaId", e.target.value.trim())} placeholder="G-XXXXXXX" />
              </Field>
            </div>
            <Button className="mt-4" onClick={() => update.mutate({ settings: { fbPixelId: settings.fbPixelId, gaId: settings.gaId } }, { onSuccess: saved })} loading={update.isPending}>
              Save pixels
            </Button>
          </Gate>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Temporary redirect" description="Send all visitors straight to one link for a period (e.g. a live sale)." />
        <CardBody>
          <Gate feature="scheduling" label="Timed redirects">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Redirect to" className="sm:col-span-3">
                <Select value={redirect.blockId} onChange={(e) => setRedirect((r) => ({ ...r, blockId: e.target.value }))}>
                  <option value="">Off</option>
                  {linkBlocks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title || b.url}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Start (optional)">
                <Input type="datetime-local" value={redirect.start} onChange={(e) => setRedirect((r) => ({ ...r, start: e.target.value }))} />
              </Field>
              <Field label="End (optional)">
                <Input type="datetime-local" value={redirect.end} onChange={(e) => setRedirect((r) => ({ ...r, end: e.target.value }))} />
              </Field>
            </div>
            <Button
              className="mt-4"
              loading={update.isPending}
              onClick={() =>
                update.mutate(
                  {
                    redirectBlockId: redirect.blockId || null,
                    redirectStartsAt: redirect.start ? new Date(redirect.start) : null,
                    redirectEndsAt: redirect.end ? new Date(redirect.end) : null,
                  },
                  { onSuccess: saved },
                )
              }
            >
              Save redirect
            </Button>
          </Gate>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Custom domain" description="Use your own domain, e.g. links.yourbrand.com" action={<Globe className="size-4 text-muted-foreground" />} />
        <CardBody className="space-y-4">
          <Gate feature="customDomain" label="Custom domains (Pro)">
            <div className="flex gap-2">
              <Input value={domain} onChange={(e) => setDomain(e.target.value.toLowerCase().trim())} placeholder="links.yourbrand.com" />
              <Button onClick={() => domainMut.mutate(domain || null)} loading={domainMut.isPending}>
                {profile.customDomain ? "Update" : "Connect"}
              </Button>
            </div>
            {profile.customDomain && (
              <div className="space-y-3 rounded-2xl bg-muted p-4 text-sm">
                <div className="flex items-center gap-2">
                  <b>{profile.customDomain}</b>
                  {profile.domainVerified ? <Badge tone="success">Verified</Badge> : <Badge tone="warning">Pending DNS</Badge>}
                </div>
                <p>Add these DNS records at your domain provider:</p>
                <div className="overflow-x-auto rounded-xl bg-white p-3 font-mono text-xs">
                  <p>CNAME {profile.customDomain} → {appHost}</p>
                  <p className="mt-1 flex items-center gap-2">
                    TXT _nickname.{profile.customDomain} → {profile.domainVerifyToken}
                    {profile.domainVerifyToken && <CopyButton value={profile.domainVerifyToken} size="icon-sm" />}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => verifyMut.mutate()} loading={verifyMut.isPending}>
                    Verify DNS
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => domainMut.mutate(null)}>
                    Remove domain
                  </Button>
                </div>
              </div>
            )}
          </Gate>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Verified badge" description="A blue check next to your name after our team reviews your page." action={<BadgeCheck className="size-5 text-sky-500" />} />
        <CardBody>
          {profile.verification === "APPROVED" ? (
            <Badge tone="success">Verified</Badge>
          ) : profile.verification === "PENDING" ? (
            <Badge tone="warning">Under review</Badge>
          ) : (
            <Button variant="outline" onClick={() => verificationMut.mutate()} loading={verificationMut.isPending}>
              {profile.verification === "REJECTED" ? "Request again" : "Request verification"}
            </Button>
          )}
        </CardBody>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader title="Danger zone" />
        <CardBody>
          <Button
            variant="destructive"
            loading={del.isPending}
            onClick={async () => {
              if (await confirm({ title: `Delete @${profile.username}?`, description: "This removes the page, blocks, shop, orders and analytics. This cannot be undone.", confirmLabel: "Delete forever", destructive: true }))
                del.mutate(profile.id);
            }}
          >
            Delete this profile
          </Button>
        </CardBody>
      </Card>
      {confirmDialog}
    </div>
  );
}
