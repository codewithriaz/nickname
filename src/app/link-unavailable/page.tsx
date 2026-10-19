import Link from "next/link";
import { siteConfig } from "@/config/site";

export const metadata = { title: "Link unavailable", robots: { index: false } };

export default function LinkUnavailable() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-muted px-6 text-center">
      <p className="text-5xl">🔗</p>
      <h1 className="font-display text-2xl font-semibold">This link is unavailable</h1>
      <p className="max-w-sm text-sm text-muted-foreground">It may have expired, been disabled, or never existed.</p>
      <Link href="/" className="mt-2 text-sm font-semibold text-primary">
        Create your own short links with {siteConfig.name} →
      </Link>
    </main>
  );
}
