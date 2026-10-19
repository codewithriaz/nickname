"use client";

import { CreditCard, ExternalLink, Lock } from "lucide-react";
import type { StoreDTO } from "@/types/dto";
import type { ManualAccounts } from "@/schemas/shop";
import {
  COUNTRIES,
  CURRENCIES,
  MANUAL_PROVIDERS,
  gatewaySupportsCurrency,
  gatewaysForCountry,
  manualProvidersForCountry,
  type GatewayKey,
} from "@/config/payment-gateways";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type PaymentDraft = {
  country: string;
  currency: string;
  codEnabled: boolean;
  manualEnabled: boolean;
  manualAccounts: ManualAccounts;
  enabledGateways: GatewayKey[];
  gatewaySandbox: boolean;
  gatewaySecrets: Partial<Record<GatewayKey, Record<string, string>>>;
};

/** Country → currency → the gateways available there. Credentials are write-only (never shown back). */
export function PaymentSettings({
  d,
  set,
  store,
  canOnline,
}: {
  d: PaymentDraft;
  set: (patch: Partial<PaymentDraft>) => void;
  store: StoreDTO | null;
  canOnline: boolean;
}) {
  const gateways = gatewaysForCountry(d.country);
  const manualKeys = manualProvidersForCountry(d.country);
  const toggleGateway = (key: GatewayKey, on: boolean) =>
    set({ enabledGateways: on ? [...new Set([...d.enabledGateways, key])] : d.enabledGateways.filter((k) => k !== key) });
  const setSecret = (key: GatewayKey, field: string, value: string) =>
    set({ gatewaySecrets: { ...d.gatewaySecrets, [key]: { ...(d.gatewaySecrets[key] ?? {}), [field]: value } } });

  return (
    <Card>
      <CardHeader title="Payments" description="Choose your country — we show the payment gateways available there." action={<CreditCard className="size-4 text-muted-foreground" />} />
      <CardBody className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Country">
            <Select
              value={d.country}
              onChange={(e) => {
                const c = COUNTRIES.find((x) => x.code === e.target.value)!;
                const available = new Set(gatewaysForCountry(c.code).map((g) => g.key));
                set({ country: c.code, currency: c.currency, enabledGateways: d.enabledGateways.filter((k) => available.has(k)) });
              }}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Shop currency" hint="Prices, checkout and gateway charges use this currency">
            <Select value={d.currency} onChange={(e) => set({ currency: e.target.value })}>
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
        </div>

        <Switch label="Cash on Delivery" description="Customer pays the delivery person (not for digital products)" checked={d.codEnabled} onCheckedChange={(codEnabled) => set({ codEnabled })} />

        <div className="space-y-3">
          <Switch
            label="Manual payment"
            description="Customer sends money and enters the transaction ID — you verify it in the order"
            checked={d.manualEnabled}
            onCheckedChange={(manualEnabled) => set({ manualEnabled })}
          />
          {d.manualEnabled && (
            <div className="grid gap-3 rounded-2xl bg-muted/60 p-3 sm:grid-cols-2">
              {manualKeys.map((k) => (
                <Field key={k} label={MANUAL_PROVIDERS[k].label} className={k === "bank" ? "sm:col-span-2" : undefined}>
                  {k === "bank" ? (
                    <Textarea rows={2} value={d.manualAccounts[k] ?? ""} onChange={(e) => set({ manualAccounts: { ...d.manualAccounts, [k]: e.target.value } })} placeholder={MANUAL_PROVIDERS[k].placeholder} />
                  ) : (
                    <Input value={d.manualAccounts[k] ?? ""} onChange={(e) => set({ manualAccounts: { ...d.manualAccounts, [k]: e.target.value } })} placeholder={MANUAL_PROVIDERS[k].placeholder} />
                  )}
                </Field>
              ))}
              <Field label="Instructions" className="sm:col-span-2">
                <Input value={d.manualAccounts.instructions ?? ""} onChange={(e) => set({ manualAccounts: { ...d.manualAccounts, instructions: e.target.value } })} />
              </Field>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">Online payment gateways</p>
            {!canOnline && (
              <Badge tone="warning">
                <Lock className="size-3" /> Starter+
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Money goes directly to your own merchant account. Credentials are encrypted and never shown again — leave a field empty to keep the saved value.</p>
          <Switch label="Sandbox / test mode" checked={d.gatewaySandbox} onCheckedChange={(gatewaySandbox) => set({ gatewaySandbox })} />
          <div className="space-y-3">
            {gateways.map((g) => {
              const enabled = d.enabledGateways.includes(g.key);
              const currencyOk = gatewaySupportsCurrency(g, d.currency);
              const configured = !!store?.gatewayConfigured[g.key];
              return (
                <div key={g.key} className={cn("rounded-2xl border p-4", enabled ? "border-primary/40 bg-primary-soft/30" : "border-border")}>
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 size-3 shrink-0 rounded-full" style={{ background: g.color }} />
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                        {g.name}
                        {configured && <Badge tone="success">credentials saved</Badge>}
                        {g.countries === "*" && <Badge>worldwide</Badge>}
                      </p>
                      <p className="text-xs text-muted-foreground">{g.description}</p>
                      {!currencyOk && <p className="mt-1 text-xs text-destructive">Doesn&apos;t support {d.currency}. Switch currency to use it.</p>}
                    </div>
                    <Switch checked={enabled} onCheckedChange={(v) => toggleGateway(g.key, v)} disabled={!canOnline || !currencyOk} />
                  </div>
                  {enabled && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {g.fields.map((f) =>
                        f.multiline ? (
                          <Textarea
                            key={f.key}
                            rows={3}
                            className="font-mono text-xs sm:col-span-2"
                            placeholder={configured ? `${f.label} — saved (leave empty to keep)` : f.label}
                            onChange={(e) => setSecret(g.key, f.key, e.target.value)}
                          />
                        ) : (
                          <Input
                            key={f.key}
                            type={f.secret ? "password" : "text"}
                            autoComplete={f.secret ? "new-password" : "off"}
                            placeholder={configured ? `${f.label} — saved` : (f.placeholder ?? f.label)}
                            onChange={(e) => setSecret(g.key, f.key, e.target.value)}
                          />
                        ),
                      )}
                      <a href={g.docsUrl} target="_blank" rel="noopener" className="flex items-center gap-1 text-xs text-primary sm:col-span-2">
                        Where do I get these? <ExternalLink className="size-3" />
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
