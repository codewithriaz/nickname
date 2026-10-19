import type { Metadata } from "next";
import Link from "next/link";
import { FEATURE_GROUPS } from "@/features/marketing/content";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Features",
  description: `Everything in ${siteConfig.name}: link in bio, 13 block types, themes, mini shop with COD & bKash, analytics, URL shortener, QR codes, affiliate links, referrals and API.`,
  alternates: { canonical: "/features" },
};

export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Every feature you need. One link.</h1>
        <p className="mt-4 text-lg text-muted-foreground">All the best of Linktree and Liinks — plus a real shop for social sellers.</p>
      </div>
      {FEATURE_GROUPS.map((g) => (
        <section key={g.title} className="mt-16">
          <h2 className="font-display text-2xl font-semibold">{g.title}</h2>
          <p className="text-muted-foreground">{g.tagline}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {g.items.map((f) => (
              <div key={f.title} className="flex gap-4 rounded-3xl border border-border bg-white p-5">
                <div className="h-fit rounded-2xl bg-primary-soft p-3 text-primary">
                  <f.icon className="size-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
      <div className="mt-16 flex justify-center">
        <Link href="/register" className={buttonVariants({ size: "lg" })}>
          Get started free
        </Link>
      </div>
    </div>
  );
}
