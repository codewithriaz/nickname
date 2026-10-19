import { Suspense } from "react";
import { BillingView } from "@/features/billing/components/billing-view";

export const metadata = { title: "Plan & billing" };

export default function BillingPage() {
  return (
    <Suspense>
      <BillingView />
    </Suspense>
  );
}
