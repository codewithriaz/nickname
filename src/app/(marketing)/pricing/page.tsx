import type { Metadata } from "next";
import { Check, Minus } from "lucide-react";
import { getPublicPlans } from "@/server/queries/public";
import { PricingSection } from "@/features/marketing/components/pricing-section";
import { COMPETITORS, FAQ } from "@/features/marketing/content";
import { PLAN_FEATURE_LABELS, type PlanFeatureKey, type PlanLimits } from "@/schemas/plan";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Pricing",
  description: `Free forever plan, paid plans from ৳299/month. Link in bio, mini shop with COD & bKash, short links, QR codes and analytics.`,
  alternates: { canonical: "/pricing" },
};

const LIMIT_ROWS: { key: keyof PlanLimits; label: string }[] = [
  { key: "profiles", label: "Profiles" },
  { key: "products", label: "Shop products" },
  { key: "shortLinks", label: "Short links" },
  { key: "monthlyOrders", label: "Orders / month" },
  { key: "analyticsDays", label: "Analytics history (days)" },
];

export default async function PricingPage() {
  const plans = await getPublicPlans();
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Simple, honest pricing</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Start free. Upgrade when you grow. Always cheaper than {COMPETITORS.map((c) => c.name.split(" ")[0]).filter((v, i, a) => a.indexOf(v) === i).join(" & ")}.
        </p>
      </div>
      <div className="mt-12">
        <PricingSection plans={plans} />
      </div>

      {plans.length > 0 && (
        <div className="mt-20 overflow-x-auto rounded-3xl border border-border bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left">
                <th className="p-4 font-semibold">Compare plans</th>
                {plans.map((p) => (
                  <th key={p.id} className="p-4 text-center font-semibold">
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {LIMIT_ROWS.map((r) => (
                <tr key={r.key}>
                  <td className="p-4 text-muted-foreground">{r.label}</td>
                  {plans.map((p) => (
                    <td key={p.id} className="p-4 text-center font-medium">
                      {p.limits[r.key] < 0 ? "Unlimited" : p.limits[r.key]}
                    </td>
                  ))}
                </tr>
              ))}
              {(Object.keys(PLAN_FEATURE_LABELS) as PlanFeatureKey[]).map((k) => (
                <tr key={k}>
                  <td className="p-4 text-muted-foreground">{PLAN_FEATURE_LABELS[k]}</td>
                  {plans.map((p) => (
                    <td key={p.id} className="p-4 text-center">
                      {p.features[k] ? <Check className="mx-auto size-4 text-primary" aria-label="Included" /> : <Minus className="mx-auto size-4 text-muted-foreground/50" aria-label="Not included" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mx-auto mt-20 max-w-3xl">
        <h2 className="text-center font-display text-2xl font-semibold">FAQ</h2>
        <dl className="mt-6 space-y-5">
          {FAQ.map((f) => (
            <div key={f.q}>
              <dt className="font-medium">{f.q}</dt>
              <dd className="mt-1 text-sm text-muted-foreground">{f.a}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-10 text-center text-xs text-muted-foreground">Prices in BDT. USD shown for reference. {siteConfig.name} accepts bKash, Nagad, Rocket, cards & bank via SSLCommerz.</p>
      </div>
    </div>
  );
}
