import { Suspense } from "react";
import { SettingsAdminView } from "@/features/admin/components/system-views";

export const metadata = { title: "Settings" };

export default function Page() {
  return (
    <Suspense>
      <SettingsAdminView />
    </Suspense>
  );
}
