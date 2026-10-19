"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ShoppingCart } from "lucide-react";
import type { OrderDTO } from "@/types/dto";
import type { OrderStatus } from "@/generated/prisma/enums";
import { useActiveProfileId, useProfile } from "@/features/profiles/hooks";
import { useOrders, useStore } from "../../hooks";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoader } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/money";
import { fromNow } from "@/lib/dayjs";
import { useDebounced } from "@/lib/hooks/use-debounced";
import { OrderStatusBadge, PaymentStatusBadge } from "./order-badges";
import { OrderDetail } from "./order-detail";
import { paymentMethodLabel } from "@/config/payment-gateways";

const FILTERS: ("ALL" | OrderStatus)[] = ["ALL", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

export function OrdersView() {
  const { profileId } = useActiveProfileId();
  const { data: profile } = useProfile(profileId);
  const { data: store, isLoading } = useStore(profileId);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"ALL" | OrderStatus>("ALL");
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, isLoading: loadingOrders } = useOrders(store?.id, { page, status: status === "ALL" ? undefined : status, search: q });

  const columns = useMemo<ColumnDef<OrderDTO, unknown>[]>(
    () => [
      { header: "Order", accessorKey: "orderNumber", cell: ({ getValue }) => <span className="font-mono font-semibold">#{getValue<string>()}</span> },
      {
        header: "Customer",
        accessorKey: "customerName",
        cell: ({ row }) => (
          <span>
            {row.original.customerName}
            <span className="block text-xs text-muted-foreground">{row.original.customerPhone}</span>
          </span>
        ),
      },
      { header: "Items", id: "items", cell: ({ row }) => row.original.items.reduce((a, i) => a + i.quantity, 0) },
      { header: "Total", accessorKey: "total", cell: ({ row }) => <b>{formatMoney(row.original.total, row.original.currency)}</b> },
      {
        header: "Payment",
        id: "payment",
        cell: ({ row }) => (
          <span className="flex items-center gap-1.5">
            <span className="text-xs">{paymentMethodLabel(row.original.paymentMethod, row.original.gateway)}</span>
            <PaymentStatusBadge status={row.original.paymentStatus} />
          </span>
        ),
      },
      { header: "Status", accessorKey: "status", cell: ({ row }) => <OrderStatusBadge status={row.original.status} /> },
      { header: "Placed", accessorKey: "createdAt", cell: ({ getValue }) => <span className="text-muted-foreground">{fromNow(getValue<string>())}</span> },
    ],
    [],
  );

  if (isLoading) return <PageLoader />;
  if (!store) return <EmptyState icon={ShoppingCart} title="No shop yet" description="Create your shop to start receiving orders." />;
  const open = data?.items.find((o) => o.id === openId);
  const counts = data?.statusCounts ?? {};

  return (
    <>
      <PageHeader title="Orders" description="Confirm, ship and track every order." />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented
          size="sm"
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          options={FILTERS.map((f) => ({ value: f, label: f === "ALL" ? "All" : `${f.charAt(0) + f.slice(1).toLowerCase()}${counts[f as OrderStatus] ? ` (${counts[f as OrderStatus]})` : ""}` }))}
        />
        <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Order #, name or phone…" className="lg:max-w-xs" />
      </div>
      <DataTable columns={columns} data={data?.items ?? []} meta={data?.meta} loading={loadingOrders} onPageChange={setPage} getRowId={(r) => r.id} onRowClick={(r) => setOpenId(r.id)} emptyText="No orders yet — share your shop link!" />
      {open && profile && <OrderDetail order={open} storeId={store.id} username={profile.username} storeName={store.name} onClose={() => setOpenId(null)} />}
    </>
  );
}
