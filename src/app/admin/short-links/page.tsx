import { Suspense } from "react";
import { ShortLinksAdminView } from "@/features/admin/components/system-views";

export const metadata = { title: "Short links" };

export default function Page() {
  return (
    <Suspense>
      <ShortLinksAdminView />
    </Suspense>
  );
}
