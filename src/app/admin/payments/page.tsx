import { Suspense } from "react";
import { PaymentsAdminView } from "@/features/admin/components/revenue-views";

export const metadata = { title: "Payments" };

export default function Page() {
  return (
    <Suspense>
      <PaymentsAdminView />
    </Suspense>
  );
}
