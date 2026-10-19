import { Suspense } from "react";
import { PlansAdminView } from "@/features/admin/components/plans-view";

export const metadata = { title: "Plans" };

export default function Page() {
  return (
    <Suspense>
      <PlansAdminView />
    </Suspense>
  );
}
