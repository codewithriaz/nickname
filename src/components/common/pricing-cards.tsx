import type { ReactNode } from "react";
import { Check, Sparkles } from "lucide-react";
import type { PlanDTO } from "@/types/dto";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export type BillingCycle = "MONTHLY" | "YEARLY";

/** Plan cards shared by the marketing pricing page and dashboard billing. */
export function PricingCards({ plans, cycle, renderAction, currentPlanId }: { plans: PlanDTO[]; cycle: BillingCycle; renderAction: (plan: PlanDTO) => ReactNode; currentPlanId?: string }) {
  return (
    <div className={cn("grid gap-4", plans.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2")}>
      {plans.map((plan) => {
        const price = cycle === "YEARLY" ? plan.priceYearly : plan.priceMonthly;
        const usd = cycle === "YEARLY" ? plan.priceYearlyUsd : plan.priceMonthlyUsd;
        const monthlyEq = cycle === "YEARLY" && plan.priceYearly ? Math.round(plan.priceYearly / 12) : null;
        return (
          <div
            key={plan.id}
            className={cn(
              "relative flex flex-col rounded-3xl border bg-white p-6",
              plan.isPopular ? "border-primary shadow-xl shadow-primary/10 ring-1 ring-primary" : "border-border",
            )}
          >
            {plan.isPopular && (
              <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                <Sparkles className="size-3" /> Most popular
              </span>
            )}
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">{plan.name}</h3>
              {currentPlanId === plan.id && <span className="rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-green-700">Current</span>}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
            <div className="mt-5 flex items-baseline gap-1">
              <span className="font-display text-4xl font-bold">{price === 0 ? "Free" : formatMoney(price)}</span>
              {price > 0 && <span className="text-sm text-muted-foreground">/{cycle === "YEARLY" ? "year" : "month"}</span>}
            </div>
            <p className="mt-1 h-4 text-xs text-muted-foreground">
              {price > 0 && `≈ $${(usd / 100).toFixed(2)}`}
              {monthlyEq ? ` · ${formatMoney(monthlyEq)}/mo` : ""}
              {plan.trialDays > 0 && price > 0 ? ` · ${plan.trialDays}-day free trial` : ""}
            </p>
            <ul className="mt-6 flex-1 space-y-2.5 text-sm">
              {plan.highlights.map((h) => (
                <li key={h} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  {h}
                </li>
              ))}
            </ul>
            <div className="mt-6">{renderAction(plan)}</div>
          </div>
        );
      })}
    </div>
  );
}
