"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Check, Plus, RotateCcw, Trash2, X } from "lucide-react";
import type { PaymentDTO } from "@/types/dto";
import { adminApi, type AdminPayoutRow, type CouponRow } from "../api";
import { useAdminList, useAdminMutation } from "../hooks";
import { qk } from "@/lib/query-keys";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { useConfirm } from "@/components/ui/confirm";
import { formatMoney } from "@/lib/money";
import { formatDate, formatDateTime, toInputDateTime } from "@/lib/dayjs";
import { useDebounced } from "@/lib/hooks/use-debounced";

const payTone = (s: string) => (s === "PAID" ? "success" : s === "PENDING" ? "warning" : s === "REFUNDED" ? "dark" : "danger") as "success" | "warning" | "dark" | "danger";

export function PaymentsAdminView() {
  const initial = useSearchParams().get("status") ?? "";
  const [status, setStatus] = useState(initial);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const { data, isLoading } = useAdminList(qk.admin.payments, adminApi.payments, { page, search: q, status: status || undefined });
  const review = useAdminMutation(({ id, action }: { id: string; action: "approve" | "reject" | "refund" }) => adminApi.reviewPayment(id, action), "Payment updated");
  const [confirmDialog, confirm] = useConfirm();

  const columns = useMemo<ColumnDef<PaymentDTO, unknown>[]>(
    () => [
      { header: "Date", accessorKey: "createdAt", cell: ({ getValue }) => formatDateTime(getValue<string>()) },
      { header: "User", accessorKey: "userEmail" },
      { header: "Plan", accessorKey: "planName", cell: ({ row }) => `${row.original.planName} · ${row.original.interval.toLowerCase()}` },
      { header: "Amount", accessorKey: "amount", cell: ({ row }) => <b>{formatMoney(row.original.amount, row.original.currency)}</b> },
      {
        header: "Method",
        accessorKey: "gateway",
        cell: ({ row }) => {
          const m = row.original.meta as { provider?: string; senderNumber?: string; trxId?: string } | null;
          return (
            <span>
              {row.original.gateway}
              {row.original.gateway === "MANUAL" && m?.trxId && (
                <span className="block text-xs text-muted-foreground">
                  {m.provider} {m.senderNumber} · <b className="font-mono">{m.trxId}</b>
                </span>
              )}
            </span>
          );
        },
      },
      { header: "Status", accessorKey: "status", cell: ({ getValue }) => <Badge tone={payTone(getValue<string>())}>{getValue<string>().toLowerCase()}</Badge> },
      { header: "Txn", accessorKey: "transactionId", cell: ({ getValue }) => <span className="font-mono text-xs">{getValue<string>()}</span> },
      {
        id: "actions",
        header: "",
        cell: ({ row }) =>
          row.original.status === "PENDING" ? (
            <div className="flex gap-1">
              <Button size="sm" variant="secondary" onClick={() => review.mutate({ id: row.original.id, action: "approve" })}>
                <Check className="size-4" /> Approve
              </Button>
              <Button size="icon-sm" variant="outline" onClick={() => review.mutate({ id: row.original.id, action: "reject" })} aria-label="Reject">
                <X className="size-4" />
              </Button>
            </div>
          ) : row.original.status === "PAID" ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                if (await confirm({ title: "Mark as refunded?", description: "Referral commission for this payment will be cancelled.", confirmLabel: "Mark refunded" }))
                  review.mutate({ id: row.original.id, action: "refund" });
              }}
            >
              <RotateCcw className="size-4" /> Refund
            </Button>
          ) : null,
      },
    ],
    [review, confirm],
  );

  return (
    <>
      <PageHeader title="Payments" description="Subscription payments from all gateways. Approve manual bKash/Nagad payments after checking the TrxID." />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Segmented size="sm" value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[{ value: "", label: "All" }, { value: "PENDING", label: "Pending" }, { value: "PAID", label: "Paid" }, { value: "FAILED", label: "Failed" }, { value: "REFUNDED", label: "Refunded" }]} />
        <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Email or transaction id…" className="max-w-xs" />
      </div>
      <DataTable columns={columns} data={data?.items ?? []} meta={data?.meta} loading={isLoading} onPageChange={setPage} getRowId={(r) => r.id} />
      {confirmDialog}
    </>
  );
}

export function PayoutsAdminView() {
  const [status, setStatus] = useState("REQUESTED");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminList(qk.admin.payouts, adminApi.payouts, { page, status: status || undefined });
  const process = useAdminMutation(({ id, status: s }: { id: string; status: "PAID" | "REJECTED" }) => adminApi.processPayout(id, s), "Payout updated");

  const columns = useMemo<ColumnDef<AdminPayoutRow, unknown>[]>(
    () => [
      { header: "Requested", accessorKey: "createdAt", cell: ({ getValue }) => formatDate(getValue<string>()) },
      { header: "User", id: "user", cell: ({ row }) => <span>{row.original.userName}<span className="block text-xs text-muted-foreground">{row.original.userEmail}</span></span> },
      { header: "Amount", accessorKey: "amount", cell: ({ getValue }) => <b>{formatMoney(getValue<number>())}</b> },
      { header: "Send to", id: "to", cell: ({ row }) => <span className="font-mono text-xs">{row.original.method}: {row.original.account}</span> },
      { header: "Status", accessorKey: "status", cell: ({ getValue }) => <Badge tone={getValue<string>() === "PAID" ? "success" : getValue<string>() === "REJECTED" ? "danger" : "warning"}>{getValue<string>().toLowerCase()}</Badge> },
      {
        id: "actions",
        header: "",
        cell: ({ row }) =>
          row.original.status === "REQUESTED" && (
            <div className="flex gap-1">
              <Button size="sm" variant="secondary" onClick={() => process.mutate({ id: row.original.id, status: "PAID" })}>
                Mark paid
              </Button>
              <Button size="sm" variant="outline" onClick={() => process.mutate({ id: row.original.id, status: "REJECTED" })}>
                Reject
              </Button>
            </div>
          ),
      },
    ],
    [process],
  );
  return (
    <>
      <PageHeader title="Referral payouts" description="Send the money, then mark the request as paid." />
      <Segmented className="mb-4" size="sm" value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[{ value: "REQUESTED", label: "Requested" }, { value: "PAID", label: "Paid" }, { value: "REJECTED", label: "Rejected" }, { value: "", label: "All" }]} />
      <DataTable columns={columns} data={data?.items ?? []} meta={data?.meta} loading={isLoading} onPageChange={setPage} getRowId={(r) => r.id} />
    </>
  );
}

export function CouponsAdminView() {
  const { data: coupons = [], isLoading } = useQuery({ queryKey: qk.admin.coupons, queryFn: adminApi.coupons });
  const [editing, setEditing] = useState<CouponRow | "new" | null>(null);
  const remove = useAdminMutation((id: string) => adminApi.deleteCoupon(id), "Coupon deleted");
  const columns = useMemo<ColumnDef<CouponRow, unknown>[]>(
    () => [
      { header: "Code", accessorKey: "code", cell: ({ getValue }) => <b className="font-mono">{getValue<string>()}</b> },
      { header: "Discount", accessorKey: "percentOff", cell: ({ getValue }) => `${getValue<number>()}%` },
      { header: "Used", id: "used", cell: ({ row }) => `${row.original.redemptions}${row.original.maxRedemptions ? ` / ${row.original.maxRedemptions}` : ""}` },
      { header: "Expires", accessorKey: "expiresAt", cell: ({ getValue }) => (getValue<string>() ? formatDate(getValue<string>()) : "Never") },
      { header: "Active", accessorKey: "isActive", cell: ({ getValue }) => <Badge tone={getValue<boolean>() ? "success" : "default"}>{getValue<boolean>() ? "yes" : "no"}</Badge> },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={() => setEditing(row.original)}>
              Edit
            </Button>
            <Button size="icon-sm" variant="ghost" onClick={() => remove.mutate(row.original.id)} aria-label="Delete">
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ),
      },
    ],
    [remove],
  );
  return (
    <>
      <PageHeader title="Coupons" description="Discount codes for plan upgrades." actions={<Button onClick={() => setEditing("new")}><Plus className="size-4" /> New coupon</Button>} />
      <DataTable columns={columns} data={coupons} loading={isLoading} getRowId={(r) => r.id} />
      {editing && <CouponEditor coupon={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function CouponEditor({ coupon, onClose }: { coupon: CouponRow | null; onClose: () => void }) {
  const [d, setD] = useState({
    code: coupon?.code ?? "",
    percentOff: coupon?.percentOff ?? 20,
    maxRedemptions: coupon?.maxRedemptions ? String(coupon.maxRedemptions) : "",
    expiresAt: toInputDateTime(coupon?.expiresAt),
    isActive: coupon?.isActive ?? true,
  });
  const save = useAdminMutation(
    () => {
      const body = { code: d.code, percentOff: d.percentOff, maxRedemptions: d.maxRedemptions ? Number(d.maxRedemptions) : null, expiresAt: d.expiresAt ? new Date(d.expiresAt) : null, isActive: d.isActive };
      return coupon ? adminApi.updateCoupon(coupon.id, body) : adminApi.createCoupon(body);
    },
    "Coupon saved",
  );
  return (
    <Dialog open onClose={onClose} title={coupon ? "Edit coupon" : "New coupon"} footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button loading={save.isPending} onClick={() => save.mutate(undefined, { onSuccess: onClose })}>Save</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Code">
          <Input value={d.code} onChange={(e) => setD((s) => ({ ...s, code: e.target.value.toUpperCase() }))} />
        </Field>
        <Field label="% off">
          <Input type="number" min={1} max={100} value={d.percentOff} onChange={(e) => setD((s) => ({ ...s, percentOff: Number(e.target.value) }))} />
        </Field>
        <Field label="Max uses (optional)">
          <Input type="number" min={1} value={d.maxRedemptions} onChange={(e) => setD((s) => ({ ...s, maxRedemptions: e.target.value }))} />
        </Field>
        <Field label="Expires (optional)">
          <Input type="datetime-local" value={d.expiresAt} onChange={(e) => setD((s) => ({ ...s, expiresAt: e.target.value }))} />
        </Field>
        <Switch label="Active" checked={d.isActive} onCheckedChange={(isActive) => setD((s) => ({ ...s, isActive }))} className="col-span-2" />
      </div>
    </Dialog>
  );
}
