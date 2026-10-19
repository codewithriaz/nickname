import { Suspense } from "react";
import { CouponsAdminView } from "@/features/admin/components/revenue-views";

export const metadata = { title: "Coupons" };

export default function Page() {
  return (
    <Suspense>
      <CouponsAdminView />
    </Suspense>
  );
}
