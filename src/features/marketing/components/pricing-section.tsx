"use client";

import { useState } from "react";
import Link from "next/link";
import type { PlanDTO } from "@/types/dto";
import { PricingCards, type BillingCycle } from "@/components/common/pricing-cards";
import { Segmented } from "@/components/ui/segmented";
import { buttonVariants } from "@/components/ui/button";

export function PricingSection({ plans }: { plans: PlanDTO[] }) {
  const [cycle, setCycle] = useState<BillingCycle>("MONTHLY");
  return (
    <div className="space-y-8">
      <div className="flex justify-center">
        <Segmented value={cycle} onChange={setCycle} options={[{ value: "MONTHLY", label: "Monthly" }, { value: "YEARLY", label: "Yearly · 2+ months free" }]} />
      </div>
      <PricingCards
        plans={plans}
        cycle={cycle}
        renderAction={(plan) => (
          <Link href="/register" className={buttonVariants({ variant: plan.isPopular ? "primary" : "outline", className: "w-full" })}>
            {plan.priceMonthly === 0 ? "Start free" : plan.trialDays ? `Start ${plan.trialDays}-day free trial` : `Choose ${plan.name}`}
          </Link>
        )}
      />
    </div>
  );
}
