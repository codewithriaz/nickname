import { Suspense } from "react";
import { UsersView } from "@/features/admin/components/users-view";

export const metadata = { title: "Users" };

export default function Page() {
  return (
    <Suspense>
      <UsersView />
    </Suspense>
  );
}
