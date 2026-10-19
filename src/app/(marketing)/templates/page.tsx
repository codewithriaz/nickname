import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Crown } from "lucide-react";
import { getPublicTemplates } from "@/server/queries/public";
import { TemplateThumb } from "@/components/common/template-thumb";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Templates",
  description: "Beautiful link-in-bio templates for creators, shops and businesses — fully customisable.",
  alternates: { canonical: "/templates" },
};

async function TemplateGrid() {
  const templates = await getPublicTemplates();
  return (
    <div className="mt-12 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
      {templates.map((t) => (
        <div key={t.id} className="overflow-hidden rounded-3xl border border-border bg-white shadow-sm">
          <TemplateThumb theme={t.theme} label={t.name} />
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="font-semibold">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.description}</p>
            </div>
            {t.isPremium && <Crown className="size-4 text-amber-500" aria-label="Premium" />}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Templates</h1>
        <p className="mt-4 text-lg text-muted-foreground">Pick a look, make it yours. New templates are added regularly.</p>
      </div>
      <Suspense fallback={<div className="mt-12 h-96 animate-pulse rounded-3xl bg-muted" />}>
        <TemplateGrid />
      </Suspense>
      <div className="mt-12 flex justify-center">
        <Link href="/register" className={buttonVariants({ size: "lg" })}>
          Use a template
        </Link>
      </div>
    </div>
  );
}
