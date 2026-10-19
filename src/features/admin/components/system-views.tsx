"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import type { ShortLinkDTO } from "@/types/dto";
import type { PlatformSettings } from "@/schemas/admin";
import { adminApi, type AdminAuditRow, type AdminOrderRow } from "../api";
import { useAdminList, useAdminMutation } from "../hooks";
import { qk } from "@/lib/query-keys";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { PageLoader } from "@/components/ui/skeleton";
import { formatMoney, toMajor, toMinor } from "@/lib/money";
import { formatDateTime } from "@/lib/dayjs";
import { compactNumber } from "@/lib/utils";
import { useDebounced } from "@/lib/hooks/use-debounced";
import { OrderStatusBadge, PaymentStatusBadge } from "@/features/shop/components/dashboard/order-badges";
import { paymentMethodLabel } from "@/config/payment-gateways";

export function OrdersAdminView() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const { data, isLoading } = useAdminList(qk.admin.orders, adminApi.orders, { page, search: q });
  const columns = useMemo<ColumnDef<AdminOrderRow, unknown>[]>(
    () => [
      { header: "Order", accessorKey: "orderNumber", cell: ({ getValue }) => <b className="font-mono">#{getValue<string>()}</b> },
      { header: "Shop", id: "shop", cell: ({ row }) => <a className="text-primary" href={`/${row.original.username}/shop`} target="_blank" rel="noopener">{row.original.storeName}</a> },
      { header: "Customer", id: "customer", cell: ({ row }) => <span>{row.original.customerName}<span className="block text-xs text-muted-foreground">{row.original.customerPhone}</span></span> },
      { header: "Total", accessorKey: "total", cell: ({ row }) => formatMoney(row.original.total, row.original.currency) },
      { header: "Payment", id: "pay", cell: ({ row }) => <span className="flex items-center gap-1 text-xs">{paymentMethodLabel(row.original.paymentMethod, row.original.gateway)} <PaymentStatusBadge status={row.original.paymentStatus} /></span> },
      { header: "Status", accessorKey: "status", cell: ({ row }) => <OrderStatusBadge status={row.original.status} /> },
      { header: "Date", accessorKey: "createdAt", cell: ({ getValue }) => formatDateTime(getValue<string>()) },
    ],
    [],
  );
  return (
    <>
      <PageHeader title="Shop orders" description="All orders across every seller (read-only)." />
      <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Order #, phone or shop…" className="mb-4 max-w-xs" />
      <DataTable columns={columns} data={data?.items ?? []} meta={data?.meta} loading={isLoading} onPageChange={setPage} getRowId={(r) => r.id} />
    </>
  );
}

export function ShortLinksAdminView() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const { data, isLoading } = useAdminList(qk.admin.shortLinks, adminApi.shortLinks, { page, search: q });
  const toggle = useAdminMutation(({ id, isActive }: { id: string; isActive: boolean }) => adminApi.toggleShortLink(id, isActive), "Updated");
  const columns = useMemo<ColumnDef<ShortLinkDTO & { userEmail: string }, unknown>[]>(
    () => [
      { header: "Code", accessorKey: "code", cell: ({ getValue }) => <b>/s/{getValue<string>()}</b> },
      { header: "Destination", accessorKey: "destination", cell: ({ getValue }) => <span className="block max-w-80 truncate text-xs">{getValue<string>()}</span> },
      { header: "Owner", accessorKey: "userEmail" },
      { header: "Clicks", accessorKey: "clicks", cell: ({ getValue }) => compactNumber(getValue<number>()) },
      { header: "Active", accessorKey: "isActive", cell: ({ row }) => <Switch checked={row.original.isActive} onCheckedChange={(isActive) => toggle.mutate({ id: row.original.id, isActive })} /> },
      { header: "Created", accessorKey: "createdAt", cell: ({ getValue }) => formatDateTime(getValue<string>()) },
    ],
    [toggle],
  );
  return (
    <>
      <PageHeader title="Short links" description="Disable abusive or phishing links instantly." />
      <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Code, URL or email…" className="mb-4 max-w-xs" />
      <DataTable columns={columns} data={data?.items ?? []} meta={data?.meta} loading={isLoading} onPageChange={setPage} getRowId={(r) => r.id} />
    </>
  );
}

export function AuditAdminView() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const { data, isLoading } = useAdminList(qk.admin.audit, adminApi.audit, { page, search: q });
  const columns = useMemo<ColumnDef<AdminAuditRow, unknown>[]>(
    () => [
      { header: "When", accessorKey: "createdAt", cell: ({ getValue }) => formatDateTime(getValue<string>()) },
      { header: "Actor", accessorKey: "actorEmail" },
      { header: "Action", accessorKey: "action", cell: ({ getValue }) => <Badge tone="primary">{getValue<string>()}</Badge> },
      { header: "Entity", id: "entity", cell: ({ row }) => <span className="font-mono text-xs">{row.original.entity} {row.original.entityId}</span> },
      { header: "Details", accessorKey: "meta", cell: ({ getValue }) => <span className="block max-w-72 truncate text-xs text-muted-foreground">{getValue() ? JSON.stringify(getValue()) : ""}</span> },
    ],
    [],
  );
  return (
    <>
      <PageHeader title="Audit log" description="Every admin action is recorded." />
      <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Action or entity…" className="mb-4 max-w-xs" />
      <DataTable columns={columns} data={data?.items ?? []} meta={data?.meta} loading={isLoading} onPageChange={setPage} getRowId={(r) => r.id} />
    </>
  );
}

export function SettingsAdminView() {
  const { data } = useQuery({ queryKey: qk.admin.settings, queryFn: adminApi.settings });
  const [s, setS] = useState<PlatformSettings | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initialise local draft once data arrives
    if (data && !s) setS(data.settings);
  }, [data, s]);
  const save = useAdminMutation((v: PlatformSettings) => adminApi.saveSettings(v), "Settings saved");
  if (!data || !s) return <PageLoader />;
  const mb = s.manualBilling;
  const setMb = (patch: Partial<PlatformSettings["manualBilling"]>) => setS({ ...s, manualBilling: { ...mb, ...patch } });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title="Platform settings" actions={<Button loading={save.isPending} onClick={() => save.mutate(s)}>Save settings</Button>} />
      <Card>
        <CardHeader title="General" />
        <CardBody className="space-y-4">
          <Switch label="Allow new sign-ups" checked={s.signupsEnabled} onCheckedChange={(signupsEnabled) => setS({ ...s, signupsEnabled })} />
          <Field label="Announcement (optional)">
            <Input value={s.announcement ?? ""} onChange={(e) => setS({ ...s, announcement: e.target.value })} />
          </Field>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Referral program" />
        <CardBody className="grid gap-3 sm:grid-cols-2">
          <Field label="Commission %">
            <Input type="number" min={0} max={90} value={s.referralPercent} onChange={(e) => setS({ ...s, referralPercent: Number(e.target.value) })} />
          </Field>
          <Field label="Minimum payout (৳)">
            <Input type="number" min={0} value={toMajor(s.referralMinPayout)} onChange={(e) => setS({ ...s, referralMinPayout: toMinor(Number(e.target.value)) })} />
          </Field>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Subscription payments" description="Online gateways are configured with environment variables (see docs/features/payment.md)." />
        <CardBody className="space-y-4">
          <div className="flex gap-2 text-sm">
            <Badge tone={data.gateways.sslcommerz ? "success" : "default"}>SSLCommerz {data.gateways.sslcommerz ? "configured" : "not configured"}</Badge>
            <Badge tone={data.gateways.bkash ? "success" : "default"}>bKash {data.gateways.bkash ? "configured" : "not configured"}</Badge>
          </div>
          <Switch label="Accept manual Send Money payments" checked={mb.enabled} onCheckedChange={(enabled) => setMb({ enabled })} />
          {mb.enabled && (
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="bKash">
                <Input value={mb.bkash ?? ""} onChange={(e) => setMb({ bkash: e.target.value })} />
              </Field>
              <Field label="Nagad">
                <Input value={mb.nagad ?? ""} onChange={(e) => setMb({ nagad: e.target.value })} />
              </Field>
              <Field label="Rocket">
                <Input value={mb.rocket ?? ""} onChange={(e) => setMb({ rocket: e.target.value })} />
              </Field>
              <Field label="Instructions" className="sm:col-span-3">
                <Textarea value={mb.instructions ?? ""} onChange={(e) => setMb({ instructions: e.target.value })} />
              </Field>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
