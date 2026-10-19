"use client";

import { useState, type FormEvent } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { unlockApi } from "../api";
import { toApiError } from "@/lib/api/client";

export function UnlockForm({ code }: { code: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { destination } = await unlockApi.unlock(code, String(new FormData(e.currentTarget).get("password") ?? ""));
      window.location.href = destination;
    } catch (err) {
      setError(toApiError(err).message);
      setLoading(false);
    }
  };
  return (
    <form onSubmit={onSubmit} className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
      <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        <Lock className="size-6" />
      </div>
      <h1 className="text-center text-lg font-semibold">This link is password protected</h1>
      <Input name="password" type="password" required placeholder="Enter password" className="mt-5" autoFocus />
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      <Button type="submit" loading={loading} className="mt-3 w-full">
        Continue
      </Button>
    </form>
  );
}
