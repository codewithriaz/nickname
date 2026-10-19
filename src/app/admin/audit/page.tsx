import { Suspense } from "react";
import { AuditAdminView } from "@/features/admin/components/system-views";

export const metadata = { title: "Audit log" };

export default function Page() {
  return (
    <Suspense>
      <AuditAdminView />
    </Suspense>
  );
}
