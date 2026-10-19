import { Suspense } from "react";
import { ProfilesAdminView } from "@/features/admin/components/profiles-view";

export const metadata = { title: "Profiles" };

export default function Page() {
  return (
    <Suspense>
      <ProfilesAdminView />
    </Suspense>
  );
}
