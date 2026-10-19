"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, ShoppingCart, Store as StoreIcon, TrendingUp, Clock } from "lucide-react";
import type { StoreDTO } from "@/types/dto";
import type { StoreInput } from "@/schemas/shop";
import type { CurrencyCode } from "@/config/payment-gateways";
import { PaymentSettings, type PaymentDraft } from "./payment-settings";
import { DesignSettings, type DesignDraft } from "./design-settings";
import { useActiveProfileId, useProfile } from "@/features/profiles/hooks";
import { useSaveStore, useStore, useStoreStats } from "../../hooks";
import { useFeature } from "@/features/auth/hooks";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button, buttonVariants } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { PageLoader } from "@/components/ui/skeleton";
import { ImageUpload } from "@/components/common/image-upload";
import { formatMoney, toMajor, toMinor } from "@/lib/money";
import { routes } from "@/config/site";

type Draft = Omit<
  StoreInput,
  "deliveryInside" | "deliveryOutside" | "freeShippingMin" | keyof PaymentDraft | keyof DesignDraft
> &
  PaymentDraft &
  DesignDraft & {
    deliveryInside: string;
    deliveryOutside: string;
    freeShippingMin: string;
  };

const toDraft = (s: StoreDTO | null, fallbackName: string): Draft => ({
  name: s?.name ?? fallbackName,
  description: s?.description ?? "",
  logoUrl: s?.logoUrl ?? null,
  bannerUrl: s?.bannerUrl ?? null,
  phone: s?.phone ?? "",
  whatsapp: s?.whatsapp ?? "",
  messengerUrl: s?.messengerUrl ?? "",
  address: s?.address ?? "",
  deliveryInside: String(toMajor(s?.deliveryInside ?? 6000)),
  deliveryOutside: String(toMajor(s?.deliveryOutside ?? 12000)),
  insideLabel: s?.insideLabel ?? "Inside Dhaka",
  outsideLabel: s?.outsideLabel ?? "Outside Dhaka",
  freeShippingMin: s?.freeShippingMin != null ? String(toMajor(s.freeShippingMin)) : "",
  country: s?.country ?? "BD",
  currency: s?.currency ?? "BDT",
  codEnabled: s?.codEnabled ?? true,
  manualEnabled: s?.manualEnabled ?? false,
  manualAccounts: s?.manualAccounts ?? {},
  enabledGateways: s?.enabledGateways ?? [],
  gatewaySandbox: s?.gatewaySandbox ?? true,
  gatewaySecrets: {},
  orderPrefix: s?.orderPrefix ?? "ORD",
  isActive: s?.isActive ?? true,
  layout: s?.layout ?? "minimal",
  brandColor: s?.brandColor ?? "#2f62d6",
  announcement: s?.announcement ?? "",
  heroSlides: s?.heroSlides ?? [],
  promoBanners: s?.promoBanners ?? [],
});

export function ShopOverview() {
  const { profileId } = useActiveProfileId();
  const { data: profile } = useProfile(profileId);
  const { data: store, isLoading } = useStore(profileId);
  const { data: stats } = useStoreStats(store?.id);
  if (!profileId || !profile || isLoading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader
        title={store ? store.name : "Create your shop"}
        description={store ? "Your mobile shop for Facebook & Instagram buyers." : "Sell with a simple mobile shop — Cash on Delivery, bKash & cards."}
        actions={
          store && (
            <a href={routes.shop(profile.username)} target="_blank" rel="noopener" className={buttonVariants({ variant: "outline" })}>
              View shop <ExternalLink className="size-4" />
            </a>
          )
        }
      />
      {store && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Pending orders" value={stats?.pending ?? 0} icon={Clock} />
          <StatCard label="Orders (30d)" value={stats?.last30 ?? 0} icon={ShoppingCart} />
          <StatCard label="Revenue (30d)" value={formatMoney(stats?.revenue30 ?? 0, store.currency)} icon={TrendingUp} className="col-span-2" />
        </div>
      )}
      {store && (
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/shop/products" className={buttonVariants({})}>
            Manage products
          </Link>
          <Link href="/dashboard/shop/orders" className={buttonVariants({ variant: "outline" })}>
            View orders
          </Link>
        </div>
      )}
      <StoreForm key={store?.id ?? "new"} profileId={profileId} store={store ?? null} fallbackName={profile.displayName} />
    </div>
  );
}

function StoreForm({ profileId, store, fallbackName }: { profileId: string; store: StoreDTO | null; fallbackName: string }) {
  const save = useSaveStore(profileId);
  const canOnline = useFeature("onlinePayments");
  const [d, setD] = useState<Draft>(() => toDraft(store, fallbackName));
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((s) => ({ ...s, [k]: v }));
  const patch = (p: Partial<Draft>) => setD((s) => ({ ...s, ...p }));

  const submit = () =>
    save.mutate({
      ...d,
      deliveryInside: toMinor(Number(d.deliveryInside) || 0),
      deliveryOutside: toMinor(Number(d.deliveryOutside) || 0),
      freeShippingMin: d.freeShippingMin ? toMinor(Number(d.freeShippingMin)) : null,
      country: d.country as StoreInput["country"],
      currency: d.currency as CurrencyCode,
      announcement: d.announcement || null,
      phone: d.phone || null,
      whatsapp: d.whatsapp || null,
      address: d.address || null,
    });

  return (
    <>
      <Card>
        <CardHeader title="Shop info" action={<StoreIcon className="size-4 text-muted-foreground" />} />
        <CardBody className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Shop name">
              <Input value={d.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Order number prefix" hint="e.g. RF → RF-1001">
              <Input value={d.orderPrefix} onChange={(e) => set("orderPrefix", e.target.value.toUpperCase())} maxLength={6} />
            </Field>
          </div>
          <Field label="Description">
            <Textarea value={d.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Logo">
              <ImageUpload value={d.logoUrl} onChange={(u) => set("logoUrl", u)} />
            </Field>
            <Field label="Banner">
              <ImageUpload value={d.bannerUrl} onChange={(u) => set("bannerUrl", u)} aspect="wide" />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Phone">
              <Input value={d.phone ?? ""} onChange={(e) => set("phone", e.target.value)} placeholder="01XXXXXXXXX" />
            </Field>
            <Field label="WhatsApp number">
              <Input value={d.whatsapp ?? ""} onChange={(e) => set("whatsapp", e.target.value)} placeholder="8801XXXXXXXXX" />
            </Field>
            <Field label="Messenger link">
              <Input value={d.messengerUrl ?? ""} onChange={(e) => set("messengerUrl", e.target.value)} placeholder="https://m.me/page" />
            </Field>
          </div>
          <Field label="Address (optional)">
            <Input value={d.address ?? ""} onChange={(e) => set("address", e.target.value)} />
          </Field>
          <Switch label="Shop is open" description="Close temporarily to stop new orders" checked={d.isActive ?? true} onCheckedChange={(v) => set("isActive", v)} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Delivery charges" />
        <CardBody className="grid gap-3 sm:grid-cols-2">
          <Field label="Zone 1 label">
            <Input value={d.insideLabel} onChange={(e) => set("insideLabel", e.target.value)} />
          </Field>
          <Field label="Zone 1 charge (৳)">
            <Input type="number" min={0} value={d.deliveryInside} onChange={(e) => set("deliveryInside", e.target.value)} />
          </Field>
          <Field label="Zone 2 label">
            <Input value={d.outsideLabel} onChange={(e) => set("outsideLabel", e.target.value)} />
          </Field>
          <Field label="Zone 2 charge (৳)">
            <Input type="number" min={0} value={d.deliveryOutside} onChange={(e) => set("deliveryOutside", e.target.value)} />
          </Field>
          <Field label="Free delivery over (৳, optional)" className="sm:col-span-2">
            <Input type="number" min={0} value={d.freeShippingMin} onChange={(e) => set("freeShippingMin", e.target.value)} />
          </Field>
        </CardBody>
      </Card>

      <PaymentSettings d={d} set={patch} store={store} canOnline={canOnline} />
      <DesignSettings d={d} set={patch} />
      <div className="sticky bottom-4 flex justify-end">
        <Button size="lg" onClick={submit} loading={save.isPending} className="shadow-xl">
          {store ? "Save shop settings" : "Create shop"}
        </Button>
      </div>
    </>
  );
}
