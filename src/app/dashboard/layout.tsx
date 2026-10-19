import type { Metadata } from "next";
import { AppProviders } from "@/components/providers/app-providers";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

/** Private area: static shell + client-side data (CSR with TanStack Query). Auth gate in src/proxy.ts. */
export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <AppProviders>
      <DashboardShell>{children}</DashboardShell>
    </AppProviders>
  );
}
