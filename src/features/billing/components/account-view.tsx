"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useMe, useUpdateAccount, useFeature } from "@/features/auth/hooks";
import { authApi } from "@/features/auth/api";
import { useApiKeyMutations, useApiKeys } from "../hooks";
import { changePasswordSchema, type ChangePasswordInput } from "@/schemas/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { PageLoader } from "@/components/ui/skeleton";
import { ImageUpload } from "@/components/common/image-upload";
import { UpgradeHint } from "@/components/common/upgrade-hint";
import { formatDate, fromNow } from "@/lib/dayjs";
import { siteConfig } from "@/config/site";
import type { ApiError } from "@/lib/api/types";

export function AccountView() {
  const { data: me } = useMe();
  const updateAccount = useUpdateAccount();
  const [name, setName] = useState<string | null>(null);
  const pw = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema) });
  const changePw = useMutation<unknown, ApiError, ChangePasswordInput>({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      toast.success("Password changed. Other devices were logged out.");
      pw.reset();
    },
    onError: (e) => toast.error(e.message),
  });
  const apiAccess = useFeature("apiAccess");
  const { data: keys = [] } = useApiKeys();
  const { create, revoke } = useApiKeyMutations();
  const [keyName, setKeyName] = useState("");
  const [newSecret, setNewSecret] = useState<string | null>(null);

  if (!me) return <PageLoader />;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title="Account & API" description={me.email} />
      <Card>
        <CardHeader title="Profile" />
        <CardBody className="space-y-4">
          <ImageUpload value={me.avatarUrl} onChange={(avatarUrl) => updateAccount.mutate({ avatarUrl })} aspect="avatar" label="Change photo" />
          <Field label="Name">
            <div className="flex gap-2">
              <Input value={name ?? me.name} onChange={(e) => setName(e.target.value)} />
              <Button variant="outline" disabled={!name || name === me.name} loading={updateAccount.isPending} onClick={() => name && updateAccount.mutate({ name })}>
                Save
              </Button>
            </div>
          </Field>
          <p className="text-xs text-muted-foreground">Member since {formatDate(me.createdAt)}</p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Change password" />
        <CardBody>
          <form onSubmit={pw.handleSubmit((v) => changePw.mutate(v))} className="grid gap-3 sm:grid-cols-2">
            <Field label="Current password" error={pw.formState.errors.currentPassword?.message}>
              <Input type="password" autoComplete="current-password" {...pw.register("currentPassword")} />
            </Field>
            <Field label="New password" error={pw.formState.errors.newPassword?.message}>
              <Input type="password" autoComplete="new-password" {...pw.register("newPassword")} />
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit" loading={changePw.isPending}>
                Update password
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="API keys" description={`Use the ${siteConfig.name} REST API (/api/v1) to manage links, short links and read orders.`} action={<KeyRound className="size-4 text-muted-foreground" />} />
        <CardBody className="space-y-4">
          {!apiAccess ? (
            <UpgradeHint text="API access is included in the Pro plan." />
          ) : (
            <>
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (keyName.trim())
                    create.mutate(keyName.trim(), {
                      onSuccess: (r) => {
                        setNewSecret(r.secret);
                        setKeyName("");
                      },
                    });
                }}
              >
                <Input value={keyName} onChange={(e) => setKeyName(e.target.value)} placeholder="Key name, e.g. Zapier" />
                <Button type="submit" loading={create.isPending}>
                  Create key
                </Button>
              </form>
              {newSecret && (
                <div className="rounded-2xl bg-warning-soft p-3 text-sm">
                  <p className="font-semibold text-amber-800">Copy your key now — it won&apos;t be shown again.</p>
                  <div className="mt-2 flex items-center gap-2">
                    <code className="flex-1 break-all rounded-lg bg-white px-2 py-1.5 text-xs">{newSecret}</code>
                    <CopyButton value={newSecret} />
                  </div>
                </div>
              )}
              <ul className="divide-y divide-border rounded-2xl border border-border">
                {keys.map((k) => (
                  <li key={k.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                    <span className="flex-1">
                      <b>{k.name}</b> <code className="text-xs text-muted-foreground">{k.prefix}…</code>
                      <span className="block text-xs text-muted-foreground">Last used {k.lastUsedAt ? fromNow(k.lastUsedAt) : "never"}</span>
                    </span>
                    {k.revokedAt ? (
                      <Badge tone="danger">revoked</Badge>
                    ) : (
                      <Button variant="ghost" size="icon-sm" onClick={() => revoke.mutate(k.id)} aria-label="Revoke key">
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    )}
                  </li>
                ))}
                {keys.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted-foreground">No API keys yet</li>}
              </ul>
              <pre className="overflow-x-auto rounded-2xl bg-zinc-900 p-4 text-xs text-zinc-100">{`curl ${siteConfig.url}/api/v1/profiles \\
  -H "Authorization: Bearer nk_your_key"`}</pre>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
