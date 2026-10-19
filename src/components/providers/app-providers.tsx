"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { makeQueryClient } from "@/lib/query-client";
import { onSessionExpired } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";
import { routes } from "@/config/site";

/** Providers for the private app (dashboard, admin, auth pages). Public pages stay provider-free. */
export function AppProviders({ children }: { children: ReactNode }) {
  const [client] = useState(makeQueryClient);

  useEffect(
    () =>
      onSessionExpired(() => {
        useAuthStore.getState().setUser(null);
        client.clear();
        const path = window.location.pathname;
        if (path.startsWith("/dashboard") || path.startsWith("/admin")) {
// eslint-disable-next-line @next/next/no-location-assign-relative-destination -- intentional full reload: auth cookies changed, client state must reset
          window.location.href = `${routes.login}?next=${encodeURIComponent(path)}`;
        }
      }),
    [client],
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster position="top-center" richColors closeButton />
    </QueryClientProvider>
  );
}
