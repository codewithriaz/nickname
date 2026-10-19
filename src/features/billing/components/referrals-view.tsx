"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Gift, HandCoins, Users, Wallet } from "lucide-react";
import type { ReferralSummaryDTO } from "@/types/dto";
import { useReferrals, useRequestPayout } from "../hooks";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { CopyButton } from "@/components/ui/copy-button";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { PageLoader } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/dayjs";

type Earning = ReferralSummaryDTO["earnings"][number];
type Payout = ReferralSummaryDTO["payouts"][number];

export function ReferralsView() {
  const { data } = useReferrals();
  const payout = useRequestPayout();
  const [method, setMethod] = useState<"bkash" | "nagad" | "rocket" | "bank">("bkash");
  const [account, setAccount] = useState("");

  const earningCols = useMemo<ColumnDef<Earning, unknown>[]>(
    () => [
      { header: "Date", accessorKey: "createdAt", cell: ({ getValue }) => formatDate(getValue<string>()) },
      { header: "Referred user", accessorKey: "referredName" },
      { header: "Commission", accessorKey: "amount", cell: ({ row }) => `${formatMoney(row.original.amount)} (${row.original.percent}%)` },
      { header: "Status", accessorKey: "status", cell: ({ getValue }) => <Badge tone={getValue<string>() === "PAID" ? "success" : "primary"}>{getValue<string>().toLowerCase()}</Badge> },
    ],
    [],
  );
  const payoutCols = useMemo<ColumnDef<Payout, unknown>[]>(
    () => [
      { header: "Date", accessorKey: "createdAt", cell: ({ getValue }) => formatDate(getValue<string>()) },
      { header: "Amount", accessorKey: "amount", cell: ({ getValue }) => formatMoney(getValue<number>()) },
      { header: "To", id: "to", cell: ({ row }) => `${row.original.method} · ${row.original.account}` },
      { header: "Status", accessorKey: "status", cell: ({ getValue }) => <Badge tone={getValue<string>() === "PAID" ? "success" : getValue<string>() === "REJECTED" ? "danger" : "warning"}>{getValue<string>().toLowerCase()}</Badge> },
    ],
    [],
  );

  if (!data) return <PageLoader />;
  const available = data.balance.approved - data.balance.requested;

  return (
    <div className="space-y-4">
      <PageHeader title="Refer & earn" description={`Earn ${data.percent}% of every payment from people you refer — for as long as they stay subscribed.`} />
      <Card className="bg-gradient-to-br from-violet-600 to-pink-500 text-white">
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm opacity-90">
              <Gift className="size-4" /> Your referral link
            </p>
            <p className="mt-1 break-all font-mono text-sm font-semibold">{data.referralUrl}</p>
            <p className="mt-1 text-xs opacity-80">Code: {data.referralCode}</p>
          </div>
          <CopyButton value={data.referralUrl} label="Copy link" className="bg-white text-foreground" />
        </CardBody>
      </Card>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Signed up" value={data.totalReferred} icon={Users} />
        <StatCard label="Paying users" value={data.paidReferred} icon={HandCoins} />
        <StatCard label="Available" value={formatMoney(Math.max(0, available))} icon={Wallet} />
        <StatCard label="Paid out" value={formatMoney(data.balance.paid)} icon={Wallet} />
      </div>
      <Card>
        <CardHeader title="Request payout" description={`Minimum payout ${formatMoney(data.minPayout)}`} />
        <CardBody className="grid gap-3 sm:grid-cols-[160px_1fr_auto] sm:items-end">
          <Field label="Method">
            <Select value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
              <option value="bkash">bKash</option>
              <option value="nagad">Nagad</option>
              <option value="rocket">Rocket</option>
              <option value="bank">Bank transfer</option>
            </Select>
          </Field>
          <Field label={method === "bank" ? "Bank, branch, account name & number" : "Account number"}>
            <Input value={account} onChange={(e) => setAccount(e.target.value)} />
          </Field>
          <Button loading={payout.isPending} disabled={available < data.minPayout || account.length < 5} onClick={() => payout.mutate({ method, account })}>
            Request {formatMoney(Math.max(0, available))}
          </Button>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Earnings" />
        <CardBody>
          <DataTable columns={earningCols} data={data.earnings} getRowId={(r) => r.id} emptyText="No earnings yet — share your link!" />
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Payouts" />
        <CardBody>
          <DataTable columns={payoutCols} data={data.payouts} getRowId={(r) => r.id} emptyText="No payouts yet" />
        </CardBody>
      </Card>
    </div>
  );
}
