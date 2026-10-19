import { Suspense } from "react";
import { Overview } from "@/features/dashboard/components/overview";

export default function DashboardHome() {
  return (
    <Suspense>
      <Overview />
    </Suspense>
  );
}
