"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PackageSearch } from "lucide-react";
import { publicShopApi } from "../../api";
import { toApiError } from "@/lib/api/client";

export function TrackOrderForm({ storeId }: { storeId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setLoading(true);
    setError(null);
    try {
      const { trackUrl } = await publicShopApi.trackOrder({ storeId, orderNumber: String(f.get("orderNumber") ?? ""), phone: String(f.get("phone") ?? "") });
      router.push(trackUrl);
    } catch (err) {
      setError(toApiError(err).message);
      setLoading(false);
    }
  };
  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-3 rounded-2xl bg-white p-6 text-zinc-900 shadow-sm ring-1 ring-black/5">
      <PackageSearch className="mx-auto size-10 text-zinc-400" />
      <h1 className="text-center text-xl font-bold">Track your order</h1>
      <input name="orderNumber" required placeholder="Order number (e.g. RF-1001)" className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900" />
      <input name="phone" required placeholder="Phone number used for the order" inputMode="tel" className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900" />
      {error && <p className="text-sm text-rose-500">{error}</p>}
      <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white disabled:opacity-60">
        {loading && <Loader2 className="size-4 animate-spin" />} Track order
      </button>
    </form>
  );
}
