"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { LogIn, Trash2 } from "lucide-react";
import type { AdminUserDTO } from "@/types/dto";
import { adminApi } from "../api";
import { useAdminList, useAdminMutation } from "../hooks";
import { qk } from "@/lib/query-keys";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { useConfirm } from "@/components/ui/confirm";
import { PageLoader } from "@/components/ui/skeleton";
import { formatDate, fromNow } from "@/lib/dayjs";
import { formatMoney } from "@/lib/money";
import { useDebounced } from "@/lib/hooks/use-debounced";
import { usePlans } from "@/features/billing/hooks";

export function UsersView() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const q = useDebounced(search);
  const { data, isLoading } = useAdminList(qk.admin.users, adminApi.users, { page, search: q, role, status });
  const [openId, setOpenId] = useState<string | null>(null);

  const columns = useMemo<ColumnDef<AdminUserDTO, unknown>[]>(
    () => [
      {
        header: "User",
        accessorKey: "email",
        cell: ({ row }) => (
          <span>
            <b>{row.original.name}</b>
            <span className="block text-xs text-muted-foreground">{row.original.email}</span>
          </span>
        ),
      },
      { header: "Plan", accessorKey: "planName", cell: ({ row }) => <Badge tone={row.original.planSlug === "free" ? "default" : "primary"}>{row.original.planName}</Badge> },
      { header: "Role", accessorKey: "role", cell: ({ getValue }) => (getValue<string>() === "SUPER_ADMIN" ? <Badge tone="dark">admin</Badge> : "user") },
      { header: "Status", accessorKey: "status", cell: ({ getValue }) => <Badge tone={getValue<string>() === "ACTIVE" ? "success" : "danger"}>{getValue<string>().toLowerCase()}</Badge> },
      { header: "Profiles", accessorKey: "profileCount" },
      { header: "Referred by", accessorKey: "referredByEmail", cell: ({ getValue }) => <span className="text-xs">{getValue<string>() ?? "—"}</span> },
      { header: "Joined", accessorKey: "createdAt", cell: ({ getValue }) => formatDate(getValue<string>()) },
      { header: "Last login", accessorKey: "lastLoginAt", cell: ({ getValue }) => fromNow(getValue<string>()) },
    ],
    [],
  );

  return (
    <>
      <PageHeader title="Users" description={`${data?.meta.total ?? 0} accounts`} />
      <div className="mb-4 flex flex-wrap gap-2">
        <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Email, name or username…" className="max-w-xs" />
        <Select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} className="w-40">
          <option value="">All roles</option>
          <option value="USER">Users</option>
          <option value="SUPER_ADMIN">Admins</option>
        </Select>
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-40">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </Select>
      </div>
      <DataTable columns={columns} data={data?.items ?? []} meta={data?.meta} loading={isLoading} onPageChange={setPage} getRowId={(r) => r.id} onRowClick={(r) => setOpenId(r.id)} />
      {openId && <UserDrawer id={openId} onClose={() => setOpenId(null)} />}
    </>
  );
}

function UserDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: user } = useQuery({ queryKey: qk.admin.user(id), queryFn: () => adminApi.user(id) });
  const { data: plans = [] } = usePlans();
  const [confirmDialog, confirm] = useConfirm();
  const [planId, setPlanId] = useState("");
  const [days, setDays] = useState("30");
  const update = useAdminMutation((body: Parameters<typeof adminApi.updateUser>[1]) => adminApi.updateUser(id, body), "User updated");
  const assign = useAdminMutation(() => adminApi.assignPlan(id, { planId, interval: "MONTHLY", periodDays: days ? Number(days) : null }), "Plan assigned");
  const remove = useAdminMutation(() => adminApi.deleteUser(id), "User deleted");
  const impersonate = useAdminMutation(() => adminApi.impersonate(id));

  return (
    <Dialog open side="right" onClose={onClose} title={user?.name ?? "User"} description={user?.email}>
      {!user ? (
        <PageLoader />
      ) : (
        <div className="space-y-5 text-sm">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted p-3">
            <span className="text-muted-foreground">Joined</span>
            <span>{formatDate(user.createdAt)}</span>
            <span className="text-muted-foreground">Referral code</span>
            <span className="font-mono">{user.referralCode}</span>
            <span className="text-muted-foreground">Referrals</span>
            <span>{user._count.referrals}</span>
            <span className="text-muted-foreground">Short links</span>
            <span>{user._count.shortLinks}</span>
            <span className="text-muted-foreground">Subscription</span>
            <span>{user.subscription ? `${user.subscription.plan.name} · ${user.subscription.status.toLowerCase()} · until ${user.subscription.currentPeriodEnd ? formatDate(user.subscription.currentPeriodEnd) : "∞"}` : "Free"}</span>
          </div>

          <div className="space-y-2">
            <p className="font-semibold">Profiles</p>
            {user.profiles.map((p) => (
              <a key={p.id} href={`/${p.username}`} target="_blank" rel="noopener" className="flex items-center justify-between rounded-xl border border-border px-3 py-2 hover:bg-muted">
                @{p.username} <Badge tone={p.verification === "APPROVED" ? "success" : "default"}>{p.verification.toLowerCase()}</Badge>
              </a>
            ))}
            {user.profiles.length === 0 && <p className="text-muted-foreground">No profiles</p>}
          </div>

          <div className="space-y-2 rounded-2xl border border-border p-3">
            <p className="font-semibold">Assign plan manually</p>
            <div className="grid grid-cols-[1fr_110px] gap-2">
              <Select value={planId} onChange={(e) => setPlanId(e.target.value)}>
                <option value="">Select plan</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
              <Input type="number" value={days} onChange={(e) => setDays(e.target.value)} placeholder="Days (∞)" />
            </div>
            <Button size="sm" disabled={!planId} loading={assign.isPending} onClick={() => assign.mutate(undefined)}>
              Assign plan
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Role">
              <Select value={user.role} onChange={(e) => update.mutate({ role: e.target.value as "USER" | "SUPER_ADMIN" })}>
                <option value="USER">User</option>
                <option value="SUPER_ADMIN">Super admin</option>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={user.status} onChange={(e) => update.mutate({ status: e.target.value as "ACTIVE" | "SUSPENDED" })}>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
              </Select>
            </Field>
          </div>

          <div className="space-y-2">
            <p className="font-semibold">Recent payments</p>
            {user.payments.map((p) => (
              <p key={p.id} className="flex justify-between text-xs">
                <span>
                  {formatDate(p.createdAt)} · {p.planName} · {p.gateway}
                </span>
                <span>
                  {formatMoney(p.amount)} <Badge tone={p.status === "PAID" ? "success" : "warning"}>{p.status.toLowerCase()}</Badge>
                </span>
              </p>
            ))}
            {user.payments.length === 0 && <p className="text-muted-foreground">None</p>}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <Button
              variant="outline"
              loading={impersonate.isPending}
// eslint-disable-next-line @next/next/no-location-assign-relative-destination -- intentional full reload: auth cookies changed, client state must reset
              onClick={() => impersonate.mutate(undefined, { onSuccess: () => (window.location.href = "/dashboard") })}
            >
              <LogIn className="size-4" /> Login as user
            </Button>
            <Button
              variant="destructive"
              loading={remove.isPending}
              onClick={async () => {
                if (await confirm({ title: `Delete ${user.email}?`, description: "All profiles, shops, orders and data will be permanently deleted.", destructive: true, confirmLabel: "Delete user" }))
                  remove.mutate(undefined, { onSuccess: onClose });
              }}
            >
              <Trash2 className="size-4" /> Delete
            </Button>
          </div>
          {confirmDialog}
        </div>
      )}
    </Dialog>
  );
}
