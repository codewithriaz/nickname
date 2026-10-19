"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import { forgotPasswordSchema, passwordSchema, type ForgotPasswordInput } from "@/schemas/auth";
import { authApi } from "../api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import type { ApiError } from "@/lib/api/types";

export function ForgotPasswordForm() {
  const { register, handleSubmit, formState } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });
  const m = useMutation<unknown, ApiError, ForgotPasswordInput>({ mutationFn: authApi.forgotPassword });

  if (m.isSuccess) {
    return (
      <div className="text-center">
        <MailCheck className="mx-auto size-10 text-primary" />
        <h1 className="mt-3 font-display text-xl font-semibold">Check your inbox</h1>
        <p className="mt-1 text-sm text-muted-foreground">If an account exists, we sent a reset link (valid for 1 hour).</p>
        <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-primary">
          Back to login
        </Link>
      </div>
    );
  }
  return (
    <form onSubmit={handleSubmit((v) => m.mutate(v))} className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">Forgot password?</h1>
        <p className="mt-1 text-sm text-muted-foreground">Enter your email and we&apos;ll send you a reset link.</p>
      </div>
      <Field label="Email" htmlFor="email" error={formState.errors.email?.message}>
        <Input id="email" type="email" {...register("email")} />
      </Field>
      {m.error && <p className="text-sm text-destructive">{m.error.message}</p>}
      <Button type="submit" className="w-full" loading={m.isPending}>
        Send reset link
      </Button>
    </form>
  );
}

const resetForm = z.object({ password: passwordSchema, confirm: z.string() }).refine((v) => v.password === v.confirm, {
  message: "Passwords don't match",
  path: ["confirm"],
});

export function ResetPasswordForm() {
  const token = useSearchParams().get("token") ?? "";
  const router = useRouter();
  const { register, handleSubmit, formState } = useForm<z.infer<typeof resetForm>>({ resolver: zodResolver(resetForm) });
  const m = useMutation<unknown, ApiError, string>({
    mutationFn: (password) => authApi.resetPassword({ token, password }),
    onSuccess: () => {
      toast.success("Password updated. Please log in.");
      router.replace("/login");
    },
  });
  return (
    <form onSubmit={handleSubmit((v) => m.mutate(v.password))} className="space-y-4">
      <h1 className="font-display text-2xl font-semibold">Set a new password</h1>
      <Field label="New password" htmlFor="password" error={formState.errors.password?.message}>
        <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
      </Field>
      <Field label="Confirm password" htmlFor="confirm" error={formState.errors.confirm?.message}>
        <Input id="confirm" type="password" autoComplete="new-password" {...register("confirm")} />
      </Field>
      {!token && <p className="text-sm text-destructive">Missing reset token — use the link from your email.</p>}
      {m.error && <p className="text-sm text-destructive">{m.error.message}</p>}
      <Button type="submit" className="w-full" loading={m.isPending} disabled={!token}>
        Update password
      </Button>
    </form>
  );
}
