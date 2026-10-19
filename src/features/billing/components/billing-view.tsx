"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertCircle, CheckCircle2, CreditCard, Smartphone } from "lucide-react";
import type { PaymentDTO, PlanDTO } from "@/types/dto";
import { useMe } from "@/features/auth/hooks";
import { useBillingMutations, useBillingOverview, usePlans } from "../hooks";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Segmented } from "@/components/ui/segmented";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { PricingCards, type BillingCycle } from "@/components/common/pricing-cards";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/dayjs";
import { cn } from "@/lib/utils";

const RESULT = {
  success: { tone: "bg-success-soft text-green-800", icon: CheckCircle2, text: "Payment successful — your plan is active." },
  failed: { tone: "bg-destructive-soft text-red-800", icon: AlertCircle, text: "Payment failed. No money was charged — please try again." },
  cancelled: { tone: "bg-warning-soft text-amber-800", icon: AlertCircle, text: "Payment cancelled." },
} as const;

export function BillingView() {
  const result = useSearchParams().get("payment") as keyof typeof RESULT | null;
  const { data: me } = useMe();
  const { data: plans = [] } = usePlans();
  const { data: overview } = useBillingOverview();
  const { trial, cancel } = useBillingMutations();
  const [cycle, setCycle] = useState<BillingCycle>("MONTHLY");
  const [checkoutPlan, setCheckoutPlan] = useState<PlanDTO | null>(null);
  const sub = me?.subscription;

  const columns = useMemo<ColumnDef<PaymentDTO, unknown>[]>(
    () => [
      { header: "Date", accessorKey: "createdAt", cell: ({ getValue }) => formatDate(getValue<string>()) },
      { header: "Plan", accessorKey: "planName", cell: ({ row }) => `${row.original.planName} · ${row.original.interval.toLowerCase()}` },
      { header: "Amount", accessorKey: "amount", cell: ({ row }) => formatMoney(row.original.amount, row.original.currency) },
      { header: "Method", accessorKey: "gateway" },
      {
        header: "Status",
        accessorKey: "status",
        cell: ({ row }) => <Badge tone={row.original.status === "PAID" ? "success" : row.original.status === "PENDING" ? "warning" : "danger"}>{row.original.status.toLowerCase()}</Badge>,
      },
      { header: "Txn", accessorKey: "transactionId", cell: ({ getValue }) => <span className="font-mono text-xs">{getValue<string>()}</span> },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Plan & billing" description="Simple pricing, always cheaper than the alternatives. Pay with bKash, Nagad or card." />
      {result && RESULT[result] && (
        <div className={cn("flex items-center gap-2 rounded-2xl p-4 text-sm font-medium", RESULT[result].tone)}>
          {(() => {
            const Icon = RESULT[result].icon;
            return <Icon className="size-5" />;
          })()}
          {RESULT[result].text}
        </div>
      )}

      {me && (
        <Card>
          <CardHeader title="Current plan" />
          <CardBody className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-display text-2xl font-semibold">{me.plan.name}</p>
              {sub && me.isPaid ? (
                <p className="text-sm text-muted-foreground">
                  {sub.status === "TRIALING" ? "Trial" : sub.interval.toLowerCase()} · {sub.cancelAtPeriodEnd ? "ends" : "renews"} {sub.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : "never"}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Free forever. Upgrade any time.</p>
              )}
            </div>
            {sub && me.isPaid && (
              <Button variant="outline" size="sm" loading={cancel.isPending} onClick={() => cancel.mutate(!sub.cancelAtPeriodEnd)}>
                {sub.cancelAtPeriodEnd ? "Resume auto-renew reminder" : "Cancel at period end"}
              </Button>
            )}
          </CardBody>
        </Card>
      )}

      <div className="flex justify-center">
        <Segmented value={cycle} onChange={setCycle} options={[{ value: "MONTHLY", label: "Monthly" }, { value: "YEARLY", label: "Yearly · save 20%" }]} />
      </div>
      <PricingCards
        plans={plans}
        cycle={cycle}
        currentPlanId={me?.plan.id}
        renderAction={(plan) =>
          plan.priceMonthly === 0 ? (
            <Button variant="outline" className="w-full" disabled>
              {me?.plan.id === plan.id ? "Current plan" : "Free"}
            </Button>
          ) : (
            <div className="space-y-2">
              <Button className="w-full" variant={plan.isPopular ? "primary" : "dark"} onClick={() => setCheckoutPlan(plan)}>
                {me?.plan.id === plan.id ? "Extend / renew" : `Upgrade to ${plan.name}`}
              </Button>
              {overview?.trialEligible && plan.trialDays > 0 && (
                <Button variant="ghost" className="w-full" loading={trial.isPending} onClick={() => trial.mutate(plan.id)}>
                  Start {plan.trialDays}-day free trial
                </Button>
              )}
            </div>
          )
        }
      />

      <Card>
        <CardHeader title="Payment history" />
        <CardBody>
          <DataTable columns={columns} data={overview?.payments ?? []} getRowId={(r) => r.id} emptyText="No payments yet" />
        </CardBody>
      </Card>

      {checkoutPlan && overview && <CheckoutDialog plan={checkoutPlan} cycle={cycle} overview={overview} onClose={() => setCheckoutPlan(null)} />}
    </div>
  );
}

function CheckoutDialog({ plan, cycle, overview, onClose }: { plan: PlanDTO; cycle: BillingCycle; overview: NonNullable<ReturnType<typeof useBillingOverview>["data"]>; onClose: () => void }) {
  const { checkout } = useBillingMutations();
  const methods = [
    overview.gateways.bkash && { value: "BKASH" as const, label: "bKash", icon: Smartphone },
    overview.gateways.sslcommerz && { value: "SSLCOMMERZ" as const, label: "Card / Nagad / Bank (SSLCommerz)", icon: CreditCard },
    overview.manual.enabled && { value: "MANUAL" as const, label: "Send Money manually", icon: Smartphone },
  ].filter(Boolean) as { value: "BKASH" | "SSLCOMMERZ" | "MANUAL"; label: string; icon: typeof CreditCard }[];
  const [gateway, setGateway] = useState(methods[0]?.value);
  const [coupon, setCoupon] = useState("");
  const [manual, setManual] = useState({ provider: "bkash" as "bkash" | "nagad" | "rocket", sender: "", trx: "" });
  const amount = cycle === "YEARLY" ? plan.priceYearly : plan.priceMonthly;

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Upgrade to ${plan.name}`}
      description={`${formatMoney(amount)} / ${cycle === "YEARLY" ? "year" : "month"}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!gateway}
            loading={checkout.isPending}
            onClick={() =>
              checkout.mutate(
                {
                  planId: plan.id,
                  interval: cycle,
                  gateway: gateway!,
                  couponCode: coupon || undefined,
                  ...(gateway === "MANUAL" ? { manualProvider: manual.provider, manualSender: manual.sender, manualTrxId: manual.trx } : {}),
                },
                { onSuccess: (r) => !r.redirectUrl && onClose() },
              )
            }
          >
            {gateway === "MANUAL" ? "Submit payment" : "Continue to payment"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {methods.length === 0 && <p className="text-sm text-destructive">No payment method is configured yet. Please contact support.</p>}
        <div className="space-y-2">
          {methods.map((m) => (
            <button key={m.value} type="button" onClick={() => setGateway(m.value)} className={cn("flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm", gateway === m.value ? "border-primary ring-1 ring-primary" : "border-border")}>
              <m.icon className="size-5 text-primary" /> {m.label}
            </button>
          ))}
        </div>
        {gateway === "MANUAL" && (
          <div className="space-y-3 rounded-2xl bg-muted p-3 text-sm">
            <Segmented size="sm" value={manual.provider} onChange={(provider) => setManual((s) => ({ ...s, provider }))} options={(["bkash", "nagad", "rocket"] as const).filter((p) => overview.manual[p]).map((p) => ({ value: p, label: p }))} />
            {overview.manual[manual.provider] && (
              <p>
                Send <b>{formatMoney(amount)}</b> to <b className="font-mono">{overview.manual[manual.provider]}</b>
              </p>
            )}
            {overview.manual.instructions && <p className="text-xs text-muted-foreground">{overview.manual.instructions}</p>}
            <Input placeholder="Your sender number" value={manual.sender} onChange={(e) => setManual((s) => ({ ...s, sender: e.target.value }))} />
            <Input placeholder="Transaction ID (TrxID)" value={manual.trx} onChange={(e) => setManual((s) => ({ ...s, trx: e.target.value }))} />
          </div>
        )}
        <Field label="Coupon code (optional)">
          <Input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} />
        </Field>
      </div>
    </Dialog>
  );
}
