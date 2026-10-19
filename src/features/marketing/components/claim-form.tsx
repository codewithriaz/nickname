"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { hostnameOf } from "@/lib/utils";
import { siteConfig } from "@/config/site";

export const CLAIM_KEY = "nk_claim";

export function ClaimForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    try {
      sessionStorage.setItem(CLAIM_KEY, username);
    } catch {
      /* storage unavailable */
    }
    router.push("/register");
  };
  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
      <label className="flex flex-1 items-center rounded-2xl border border-input bg-white px-4 shadow-sm focus-within:ring-2 focus-within:ring-ring">
        <span className="text-sm text-muted-foreground">{hostnameOf(siteConfig.url)}/</span>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))}
          placeholder="yourname"
          className="h-12 w-full bg-transparent text-sm font-medium outline-none"
          aria-label="Choose your username"
        />
      </label>
      <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-sm font-semibold text-white shadow-lg shadow-primary/30 hover:bg-primary-hover">
        Claim it free <ArrowRight className="size-4" />
      </button>
    </form>
  );
}
