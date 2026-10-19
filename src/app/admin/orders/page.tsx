import { Suspense } from "react";
import { OrdersAdminView } from "@/features/admin/components/system-views";

export const metadata = { title: "Orders" };

export default function Page() {
  return (
    <Suspense>
      <OrdersAdminView />
    </Suspense>
  );
}
