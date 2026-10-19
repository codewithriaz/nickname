import { Suspense } from "react";
import { TemplatesAdminView } from "@/features/admin/components/templates-view";

export const metadata = { title: "Templates" };

export default function Page() {
  return (
    <Suspense>
      <TemplatesAdminView />
    </Suspense>
  );
}
