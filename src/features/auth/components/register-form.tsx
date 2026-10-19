"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Gift } from "lucide-react";
import { registerSchema, type RegisterInput } from "@/schemas/auth";
import { authApi } from "../api";
import { useAuthSuccess } from "../hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import type { ApiError } from "@/lib/api/types";

export function RegisterForm() {
  const params = useSearchParams();
  const ref = params.get("ref") ?? undefined;
  const onSuccess = useAuthSuccess();
  const { register, handleSubmit, formState } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { referralCode: ref },
  });
  const signup = useMutation<Awaited<ReturnType<typeof authApi.register>>, ApiError, RegisterInput>({
    mutationFn: authApi.register,
    onSuccess: (me) => onSuccess(me, "/dashboard?welcome=1"),
  });

  return (
    <form onSubmit={handleSubmit((v) => signup.mutate(v))} className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">Create your free account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Launch your link page and shop in 2 minutes. No card needed.</p>
      </div>
      {ref && (
        <p className="flex items-center gap-2 rounded-xl bg-primary-soft px-3 py-2 text-xs font-medium text-primary">
          <Gift className="size-4" /> Invited with code {ref.toUpperCase()}
        </p>
      )}
      <Field label="Your name" htmlFor="name" error={formState.errors.name?.message}>
        <Input id="name" autoComplete="name" {...register("name")} />
      </Field>
      <Field label="Email" htmlFor="email" error={formState.errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
      </Field>
      <Field label="Password" htmlFor="password" error={formState.errors.password?.message} hint="At least 8 characters with a letter and a number">
        <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
      </Field>
      {signup.error && <p className="rounded-xl bg-destructive-soft p-3 text-sm text-red-700">{signup.error.message}</p>}
      <Button type="submit" className="w-full" size="lg" loading={signup.isPending}>
        Create account
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary">
          Log in
        </Link>
      </p>
    </form>
  );
}
