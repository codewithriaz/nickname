"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { loginSchema, type LoginInput } from "@/schemas/auth";
import { authApi } from "../api";
import { useAuthSuccess } from "../hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import type { ApiError } from "@/lib/api/types";

export function LoginForm() {
  const next = useSearchParams().get("next");
  const onSuccess = useAuthSuccess();
  const { register, handleSubmit, formState } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
  const login = useMutation<Awaited<ReturnType<typeof authApi.login>>, ApiError, LoginInput>({
    mutationFn: authApi.login,
    onSuccess: (me) => onSuccess(me, next),
  });

  return (
    <form onSubmit={handleSubmit((v) => login.mutate(v))} className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Log in to manage your pages and shop.</p>
      </div>
      <Field label="Email" htmlFor="email" error={formState.errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
      </Field>
      <Field
        label="Password"
        htmlFor="password"
        error={formState.errors.password?.message}
        action={
          <Link href="/forgot-password" className="text-xs font-medium text-primary">
            Forgot?
          </Link>
        }
      >
        <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
      </Field>
      {login.error && <p className="rounded-xl bg-destructive-soft p-3 text-sm text-red-700">{login.error.message}</p>}
      <Button type="submit" className="w-full" size="lg" loading={login.isPending}>
        Log in
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/register" className="font-semibold text-primary">
          Create a free account
        </Link>
      </p>
    </form>
  );
}
