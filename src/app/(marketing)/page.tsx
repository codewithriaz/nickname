import Link from "next/link";
import { ArrowRight, Check, Star } from "lucide-react";
import { getPublicPlans } from "@/server/queries/public";
import { ProfileView } from "@/components/profile-renderer/profile-view";
import { buttonVariants } from "@/components/ui/button";
import { ClaimForm } from "@/features/marketing/components/claim-form";
import { demoProfile } from "@/features/marketing/demo-profile";
import { COMPETITORS, FAQ, FEATURE_GROUPS } from "@/features/marketing/content";
import { formatMoney } from "@/lib/money";
import { siteConfig } from "@/config/site";

function Phone({ template }: { template: string }) {
  return (
    <div className="w-[270px] shrink-0 rounded-[42px] border-[9px] border-zinc-900 bg-zinc-900 shadow-2xl shadow-violet-500/20">
      <div className="h-[540px] overflow-hidden rounded-[33px] [&_main]:min-h-[540px] [&_main]:pt-8">
        <ProfileView data={demoProfile(template)} preview />
      </div>
    </div>
  );
}

/** Static home page (plans are a cached query → part of the static shell). */
export default async function HomePage() {
  const plans = await getPublicPlans();
  const cheapestPaid = plans.filter((p) => p.priceMonthly > 0).sort((a, b) => a.priceMonthly - b.priceMonthly)[0];

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="absolute -top-40 left-1/2 size-[600px] -translate-x-1/2 rounded-full bg-gradient-to-br from-violet-300/40 to-pink-300/40 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-[1.1fr_1fr] lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/70 px-3 py-1 text-xs font-semibold text-primary">
              <Star className="size-3.5 fill-primary" /> Link in bio + mini shop · built for Bangladesh
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl">
              One link for your <span className="bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">whole business</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Share all your links, sell products with Cash on Delivery & bKash, shorten URLs, print QR codes and see what works — from one beautiful page.
            </p>
            <div className="mt-8">
              <ClaimForm />
              <p className="mt-3 text-xs text-muted-foreground">Free forever · No card needed · Setup in 2 minutes</p>
            </div>
          </div>
          <div className="flex justify-center gap-6">
            <Phone template="bazaar" />
            <div className="hidden translate-y-10 xl:block">
              <Phone template="midnight" />
            </div>
          </div>
        </div>
      </section>

      {FEATURE_GROUPS.map((group, gi) => (
        <section key={group.title} className={gi % 2 === 1 ? "bg-muted/50" : ""}>
          <div className="mx-auto max-w-6xl px-4 py-20">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">{group.title}</p>
            <h2 className="mt-2 max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">{group.tagline}</h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((f) => (
                <div key={f.title} className="rounded-3xl border border-border bg-white p-6">
                  <div className="mb-4 inline-flex rounded-2xl bg-primary-soft p-3 text-primary">
                    <f.icon className="size-5" />
                  </div>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid items-center gap-10 rounded-[2rem] bg-gradient-to-br from-violet-700 via-fuchsia-600 to-pink-500 p-8 text-white sm:p-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">Pay less. Get more.</h2>
            <p className="mt-3 text-white/85">
              Paid plans from <b>{cheapestPaid ? formatMoney(cheapestPaid.priceMonthly) : "৳299"}/month</b> — with a shop, short links and QR codes included.
            </p>
            <Link href="/pricing" className={buttonVariants({ size: "lg", className: "mt-6 bg-white text-violet-700 hover:bg-white/90" })}>
              See pricing <ArrowRight className="size-4" />
            </Link>
          </div>
          <ul className="space-y-3">
            {COMPETITORS.map((c) => (
              <li key={c.name} className="flex items-center justify-between rounded-2xl bg-white/10 px-5 py-3 backdrop-blur">
                <span>{c.name}</span>
                <s className="opacity-80">{c.price}</s>
              </li>
            ))}
            <li className="flex items-center justify-between rounded-2xl bg-white px-5 py-3 font-semibold text-violet-700">
              <span>{siteConfig.name} Starter</span>
              <span>{cheapestPaid ? `$${(cheapestPaid.priceMonthlyUsd / 100).toFixed(2)}` : "$2.50"} / mo</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20">
        <h2 className="text-center font-display text-3xl font-semibold">Questions</h2>
        <div className="mt-8 divide-y divide-border rounded-3xl border border-border bg-white">
          {FAQ.map((f) => (
            <details key={f.q} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="text-xl text-muted-foreground transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-muted/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-16 text-center">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">Your link is waiting.</h2>
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {["Unlimited links", "Mini shop with COD", "Free short links & QR"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <Check className="size-4 text-primary" /> {t}
              </li>
            ))}
          </ul>
          <ClaimForm />
        </div>
      </section>
    </>
  );
}
