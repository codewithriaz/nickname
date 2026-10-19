import { Suspense } from "react";
import { AdminDashboard } from "@/features/admin/components/admin-dashboard";

export const metadata = { title: "Overview" };

export default function Page() {
  return (
    <Suspense>
      <AdminDashboard />
    </Suspense>
  );
}
