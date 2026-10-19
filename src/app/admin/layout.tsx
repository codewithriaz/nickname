import type { Metadata } from "next";
import { AppProviders } from "@/components/providers/app-providers";
import { AdminShell } from "@/features/admin/components/admin-shell";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false } };

/** Super admin area (CSR + TanStack Query/Table). Role enforced in proxy.ts and every /api/admin route. */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <AppProviders>
      <AdminShell>{children}</AdminShell>
    </AppProviders>
  );
}
