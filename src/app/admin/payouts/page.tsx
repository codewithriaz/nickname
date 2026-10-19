import { Suspense } from "react";
import { PayoutsAdminView } from "@/features/admin/components/revenue-views";

export const metadata = { title: "Payouts" };

export default function Page() {
  return (
    <Suspense>
      <PayoutsAdminView />
    </Suspense>
  );
}
