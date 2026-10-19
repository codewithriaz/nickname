"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Star } from "lucide-react";
import type { PlanDTO } from "@/types/dto";
import type { PlanFeatureKey, PlanInput, PlanLimits } from "@/schemas/plan";
import { PLAN_FEATURE_LABELS } from "@/schemas/plan";
import { DEFAULT_PLANS } from "@/config/plans";
import { adminApi } from "../api";
import { useAdminMutation } from "../hooks";
import { qk } from "@/lib/query-keys";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { formatMoney, toMajor, toMinor } from "@/lib/money";

const LIMIT_LABELS: Record<keyof PlanLimits, string> = {
  profiles: "Profiles",
  blocksPerProfile: "Blocks per profile",
  products: "Products",
  shortLinks: "Short links",
  analyticsDays: "Analytics history (days)",
  monthlyOrders: "Orders per month",
};

export function PlansAdminView() {
  const { data: plans = [] } = useQuery({ queryKey: qk.admin.plans, queryFn: adminApi.plans });
  const [editing, setEditing] = useState<PlanDTO | "new" | null>(null);
  return (
    <>
      <PageHeader
        title="Plans"
        description="Prices, limits and features. Changes apply immediately to every user on the plan."
        actions={
          <Button onClick={() => setEditing("new")}>
            <Plus className="size-4" /> New plan
          </Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => (
          <Card key={p.id} className="cursor-pointer p-5 transition hover:border-primary" onClick={() => setEditing(p)}>
            <div className="flex items-center gap-2">
              <h3 className="flex-1 font-display text-lg font-semibold">{p.name}</h3>
              {p.isDefault && <Badge>default</Badge>}
              {p.isPopular && <Star className="size-4 fill-amber-400 text-amber-400" />}
              {!p.isActive && <Badge tone="danger">inactive</Badge>}
            </div>
            <p className="mt-1 text-sm">
              {formatMoney(p.priceMonthly)}/mo · {formatMoney(p.priceYearly)}/yr
            </p>
            <p className="text-xs text-muted-foreground">
              ${toMajor(p.priceMonthlyUsd)}/mo · ${toMajor(p.priceYearlyUsd)}/yr · {p.subscribers} subscriptions
            </p>
            <ul className="mt-3 space-y-0.5 text-xs text-muted-foreground">
              {(Object.keys(LIMIT_LABELS) as (keyof PlanLimits)[]).map((k) => (
                <li key={k}>
                  {LIMIT_LABELS[k]}: <b className="text-foreground">{p.limits[k] < 0 ? "∞" : p.limits[k]}</b>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      {editing && <PlanEditor plan={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function PlanEditor({ plan, onClose }: { plan: PlanDTO | null; onClose: () => void }) {
  const base: PlanInput = plan ?? { ...DEFAULT_PLANS[1], slug: "", name: "", isDefault: false, isPopular: false, sortOrder: 10 };
  const [d, setD] = useState<PlanInput>(base);
  const [highlights, setHighlights] = useState(base.highlights.join("\n"));
  const save = useAdminMutation((input: PlanInput) => (plan ? adminApi.updatePlan(plan.id, input) : adminApi.createPlan(input)), "Plan saved");
  const set = <K extends keyof PlanInput>(k: K, v: PlanInput[K]) => setD((s) => ({ ...s, [k]: v }));
  const money = (k: "priceMonthly" | "priceYearly" | "priceMonthlyUsd" | "priceYearlyUsd", label: string) => (
    <Field label={label}>
      <Input type="number" min={0} step="0.01" value={toMajor(d[k])} onChange={(e) => set(k, toMinor(Number(e.target.value) || 0))} />
    </Field>
  );

  return (
    <Dialog
      open
      onClose={onClose}
      size="xl"
      title={plan ? `Edit ${plan.name}` : "New plan"}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={save.isPending} onClick={() => save.mutate({ ...d, highlights: highlights.split("\n").map((h) => h.trim()).filter(Boolean) }, { onSuccess: onClose })}>
            Save plan
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Name">
            <Input value={d.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Slug">
            <Input value={d.slug} onChange={(e) => set("slug", e.target.value.toLowerCase())} />
          </Field>
          <Field label="Trial days">
            <Input type="number" min={0} value={d.trialDays} onChange={(e) => set("trialDays", Number(e.target.value))} />
          </Field>
        </div>
        <Field label="Description">
          <Input value={d.description} onChange={(e) => set("description", e.target.value)} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-4">
          {money("priceMonthly", "Monthly (৳)")}
          {money("priceYearly", "Yearly (৳)")}
          {money("priceMonthlyUsd", "Monthly ($)")}
          {money("priceYearlyUsd", "Yearly ($)")}
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">Limits (-1 = unlimited)</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {(Object.keys(LIMIT_LABELS) as (keyof PlanLimits)[]).map((k) => (
              <Field key={k} label={LIMIT_LABELS[k]}>
                <Input type="number" min={k === "analyticsDays" ? 1 : -1} value={d.limits[k]} onChange={(e) => set("limits", { ...d.limits, [k]: Number(e.target.value) })} />
              </Field>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">Features</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(PLAN_FEATURE_LABELS) as PlanFeatureKey[]).map((k) => (
              <Switch key={k} label={PLAN_FEATURE_LABELS[k]} checked={d.features[k]} onCheckedChange={(v) => set("features", { ...d.features, [k]: v })} />
            ))}
          </div>
        </div>
        <Field label="Highlights (one per line, shown on pricing page)">
          <Textarea rows={5} value={highlights} onChange={(e) => setHighlights(e.target.value)} />
        </Field>
        <div className="flex flex-wrap gap-6">
          <Switch label="Active" checked={d.isActive} onCheckedChange={(v) => set("isActive", v)} />
          <Switch label="Default (free fallback)" checked={d.isDefault} onCheckedChange={(v) => set("isDefault", v)} />
          <Switch label="Most popular badge" checked={d.isPopular} onCheckedChange={(v) => set("isPopular", v)} />
        </div>
      </div>
    </Dialog>
  );
}
