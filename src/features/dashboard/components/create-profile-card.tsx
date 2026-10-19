"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Sparkles, XCircle } from "lucide-react";
import { createProfileSchema, type CreateProfileInput } from "@/schemas/profile";
import { useCreateProfile } from "@/features/profiles/hooks";
import { profilesApi } from "@/features/profiles/api";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { hostnameOf } from "@/lib/utils";

/** Username typed on the landing page before sign-up. */
function readClaim() {
  if (typeof window === "undefined") return "";
  try {
    return sessionStorage.getItem("nk_claim") ?? "";
  } catch {
    return "";
  }
}

/** Username availability with debounce. */
function useUsernameCheck(username: string) {
  const [state, setState] = useState<{ checking: boolean; available?: boolean; reason?: string | null }>({ checking: false });
  useEffect(() => {
    if (username.length < 3) return;
    const t = setTimeout(async () => {
      setState({ checking: true });
      try {
        const r = await profilesApi.checkUsername(username);
        setState({ checking: false, ...r });
      } catch {
        setState({ checking: false });
      }
    }, 400);
    return () => clearTimeout(t);
  }, [username]);
  return username.length < 3 ? { checking: false } : state;
}

export function CreateProfileCard({ onboarding, onCreated }: { onboarding?: boolean; onCreated?: () => void }) {
  const create = useCreateProfile();
  const { register, handleSubmit, control, formState } = useForm<CreateProfileInput>({
    resolver: zodResolver(createProfileSchema),
    defaultValues: { username: readClaim() },
  });
  const username = (useWatch({ control, name: "username" }) ?? "").toLowerCase();
  const check = useUsernameCheck(username);

  return (
    <Card className="mx-auto max-w-lg p-6 sm:p-8">
      {onboarding && (
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <Sparkles className="size-6" />
          </div>
          <h1 className="font-display text-2xl font-semibold">Claim your link</h1>
          <p className="mt-1 text-sm text-muted-foreground">Pick a username — this becomes your page address.</p>
        </div>
      )}
      <form onSubmit={handleSubmit((v) => create.mutate(v, { onSuccess: () => onCreated?.() }))} className="space-y-4">
        <Field
          label="Username"
          htmlFor="username"
          error={formState.errors.username?.message ?? (check.available === false ? (check.reason ?? "Not available") : undefined)}
          hint={check.available ? (
            <span className="flex items-center gap-1 text-success">
              <CheckCircle2 className="size-3.5" /> Available
            </span>
          ) : undefined}
        >
          <div className="flex items-center rounded-xl border border-input bg-white focus-within:ring-2 focus-within:ring-ring/60">
            <span className="pl-3 text-sm text-muted-foreground">{hostnameOf(siteConfig.url) ?? "nickname"}/</span>
            <input id="username" {...register("username")} className="h-10 w-full bg-transparent pr-3 text-sm outline-none" placeholder="yourname" autoComplete="off" />
            {check.available === false && <XCircle className="mr-3 size-4 text-destructive" />}
          </div>
        </Field>
        <Field label="Display name" htmlFor="displayName" error={formState.errors.displayName?.message}>
          <Input id="displayName" {...register("displayName")} placeholder="Your shop or brand name" />
        </Field>
        <Button type="submit" className="w-full" size="lg" loading={create.isPending} disabled={check.available === false}>
          Create my page
        </Button>
      </form>
    </Card>
  );
}
