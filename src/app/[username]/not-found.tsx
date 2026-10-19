import Link from "next/link";
import { siteConfig } from "@/config/site";

export default function ProfileNotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-gradient-to-b from-violet-50 to-pink-50 px-6 text-center">
      <p className="text-6xl">🔍</p>
      <h1 className="font-display text-2xl font-semibold">This page doesn&apos;t exist yet</h1>
      <p className="max-w-sm text-sm text-muted-foreground">The username may be available! Claim it on {siteConfig.name} for free.</p>
      <Link href="/register" className="mt-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white">
        Claim this username
      </Link>
    </main>
  );
}
