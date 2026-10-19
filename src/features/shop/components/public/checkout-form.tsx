"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Banknote, CreditCard, Loader2, Minus, Plus, ShoppingBag, Smartphone, Trash2 } from "lucide-react";
import type { PublicStoreData } from "@/types/public";
import { useCart, useCartStore } from "@/stores/cart-store";
import { publicShopApi } from "../../api";
import { toApiError } from "@/lib/api/client";
import { formatMoney } from "@/lib/money";
import { routes } from "@/config/site";
import { bdPhone } from "@/schemas/common";
import { track } from "@/features/public/api";
import { useHydrated } from "./cart-button";
import { cn } from "@/lib/utils";
import { MANUAL_PROVIDERS, manualProvidersForCountry, type ManualProvider } from "@/config/payment-gateways";

const formSchema = z
  .object({
    customerName: z.string().trim().min(2, "Enter your name").max(80),
    customerPhone: bdPhone,
    customerEmail: z.email("Invalid email").optional().or(z.literal("")),
    address: z.string().trim().min(5, "Enter your full address").max(500),
    city: z.string().trim().max(80),
    deliveryZone: z.enum(["inside", "outside"]),
    note: z.string().trim().max(500).optional(),
    /** "COD" | "MANUAL" | online gateway key */
    choice: z.string().min(1, "Choose a payment method"),
    manualProvider: z.enum(["bkash", "nagad", "rocket", "upi", "bank"]).optional(),
    manualSender: z.string().trim().max(20).optional(),
    manualTrxId: z.string().trim().max(40).optional(),
  })
  .refine((v) => v.choice !== "MANUAL" || (v.manualSender && v.manualTrxId), {
    message: "Enter your account/number and transaction ID",
    path: ["manualTrxId"],
  });
type FormIn = z.input<typeof formSchema>;
type FormOut = z.output<typeof formSchema>;

const inputCls = "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-900";

export function CheckoutForm({ data }: { data: PublicStoreData }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const { store, profile } = data;
  const lines = useCart(store.id);
  const { setQuantity, remove, clear } = useCartStore.getState();
  const [serverError, setServerError] = useState<string | null>(null);

  // Digital products are delivered by download link — they can't be paid on delivery.
  const productTypes = useMemo(() => new Map(data.products.map((p) => [p.id, p.type])), [data.products]);
  const hasDigital = lines.some((l) => productTypes.get(l.productId) === "DIGITAL");
  const onlyDigital = lines.length > 0 && lines.every((l) => productTypes.get(l.productId) === "DIGITAL");

  // Manual methods valid for the shop's country that the seller filled in (bKash/Nagad/Rocket, UPI, bank…)
  const manualProviders = useMemo(
    () => manualProvidersForCountry(store.country).filter((p) => !!store.payment.manualAccounts[p]),
    [store.country, store.payment.manualAccounts],
  );

  const methods = useMemo(
    () =>
      [
        store.payment.cod && !hasDigital && { value: "COD", label: "Cash on Delivery", icon: Banknote, hint: "Pay when you receive", color: undefined },
        ...store.payment.gateways.map((g) => ({ value: g.key, label: g.label, icon: CreditCard, hint: g.hint, color: g.color })),
        store.payment.manual &&
          manualProviders.length > 0 && {
            value: "MANUAL",
            label: manualProviders.length === 1 ? MANUAL_PROVIDERS[manualProviders[0]].label : "Send money manually",
            icon: Smartphone,
            hint: manualProviders.map((p) => MANUAL_PROVIDERS[p].label.replace(/ \(.*\)/, "")).join(", ") + " · enter transaction ID",
            color: undefined,
          },
      ].filter(Boolean) as { value: string; label: string; icon: typeof Banknote; hint: string; color?: string }[],
    [store.payment, hasDigital, manualProviders],
  );

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(formSchema),
    defaultValues: { deliveryZone: "inside", choice: methods[0]?.value ?? "", manualProvider: manualProviders[0], city: "" },
  });
  const zone = useWatch({ control, name: "deliveryZone" });
  const method = useWatch({ control, name: "choice" });
  const manualProvider = useWatch({ control, name: "manualProvider" });

  useEffect(() => {
    track({ type: "CHECKOUT_START", profileId: profile.id });
  }, [profile.id]);

  // Keep the selected method valid when the cart changes (e.g. a digital item removes COD).
  useEffect(() => {
    if (methods.length && !methods.some((m) => m.value === method)) setValue("choice", methods[0].value);
  }, [methods, method, setValue]);

  const subtotal = lines.reduce((a, l) => a + l.price * l.quantity, 0);
  const shipping =
    onlyDigital || (store.freeShippingMin != null && subtotal >= store.freeShippingMin) ? 0 : zone === "inside" ? store.deliveryInside : store.deliveryOutside;
  const total = subtotal + shipping;

  const onSubmit = async ({ choice, ...values }: FormOut) => {
    setServerError(null);
    const isOnline = choice !== "COD" && choice !== "MANUAL";
    try {
      const res = await publicShopApi.checkout({
        ...values,
        paymentMethod: isOnline ? "ONLINE" : (choice as "COD" | "MANUAL"),
        gateway: isOnline ? (choice as (typeof store.payment.gateways)[number]["key"]) : undefined,
        storeId: store.id,
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, options: l.options })),
      });
      clear(store.id);
      if (res.redirectUrl) window.location.assign(res.redirectUrl);
      else router.push(res.trackUrl);
    } catch (e) {
      setServerError(toApiError(e).message);
    }
  };

  if (!hydrated) return <div className="h-64 animate-pulse rounded-3xl bg-white/60" />;

  if (lines.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center text-zinc-900 shadow-sm">
        <ShoppingBag className="mx-auto size-10 text-zinc-300" />
        <p className="mt-3 font-semibold">Your cart is empty</p>
        <Link href={routes.shop(profile.username)} className="mt-4 inline-block rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white">
          Continue shopping
        </Link>
      </div>
    );
  }

  const manualNumber = manualProvider ? store.payment.manualAccounts[manualProvider as ManualProvider] : undefined;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-zinc-900">
      <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <h2 className="mb-3 font-semibold">Your order</h2>
        <ul className="divide-y divide-zinc-100">
          {lines.map((l) => (
            <li key={l.key} className="flex items-center gap-3 py-3">
              {l.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={l.image} alt="" className="size-14 rounded-xl object-cover" />
              ) : (
                <span className="flex size-14 items-center justify-center rounded-xl bg-zinc-100">
                  <ShoppingBag className="size-5 text-zinc-400" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{l.name}</p>
                {Object.keys(l.options).length > 0 && <p className="text-xs text-zinc-500">{Object.entries(l.options).map(([k, v]) => `${k}: ${v}`).join(", ")}</p>}
                <p className="text-sm font-semibold">{formatMoney(l.price * l.quantity, store.currency)}</p>
              </div>
              <div className="flex items-center rounded-lg border border-zinc-200">
                <button type="button" className="p-1.5" onClick={() => setQuantity(store.id, l.key, l.quantity - 1)} aria-label="Decrease">
                  <Minus className="size-3.5" />
                </button>
                <span className="w-6 text-center text-xs font-semibold">{l.quantity}</span>
                <button type="button" className="p-1.5" onClick={() => setQuantity(store.id, l.key, l.quantity + 1)} aria-label="Increase">
                  <Plus className="size-3.5" />
                </button>
              </div>
              <button type="button" onClick={() => remove(store.id, l.key)} className="p-1.5 text-zinc-400 hover:text-rose-500" aria-label="Remove">
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <h2 className="font-semibold">Delivery details</h2>
        <div>
          <input {...register("customerName")} placeholder="Full name *" className={inputCls} autoComplete="name" />
          {errors.customerName && <p className="mt-1 text-xs text-rose-500">{errors.customerName.message}</p>}
        </div>
        <div>
          <input {...register("customerPhone")} placeholder="Phone number * (01XXXXXXXXX)" inputMode="tel" className={inputCls} autoComplete="tel" />
          {errors.customerPhone && <p className="mt-1 text-xs text-rose-500">{errors.customerPhone.message}</p>}
        </div>
        <div>
          <textarea {...register("address")} rows={2} placeholder="Full address (house, road, area) *" className={inputCls} autoComplete="street-address" />
          {errors.address && <p className="mt-1 text-xs text-rose-500">{errors.address.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input {...register("city")} placeholder="District / City" className={inputCls} />
          <input {...register("customerEmail")} placeholder="Email (optional)" type="email" className={inputCls} />
        </div>
        {!onlyDigital && (
          <div className="grid grid-cols-2 gap-2">
            {(["inside", "outside"] as const).map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => setValue("deliveryZone", z)}
                className={cn("rounded-xl border px-3 py-2.5 text-left text-sm", zone === z ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200")}
              >
                <span className="block font-medium">{z === "inside" ? store.insideLabel : store.outsideLabel}</span>
                <span className="text-xs opacity-80">{formatMoney(z === "inside" ? store.deliveryInside : store.deliveryOutside, store.currency)}</span>
              </button>
            ))}
          </div>
        )}
        <input {...register("note")} placeholder="Note for seller (optional)" className={inputCls} />
      </section>

      <section className="space-y-2 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <h2 className="mb-1 font-semibold">Payment</h2>
        {hasDigital && store.payment.cod && (
          <p className="rounded-xl bg-zinc-50 p-3 text-xs text-zinc-600">Cash on Delivery isn&apos;t available because your cart has a digital product. Please pay in advance.</p>
        )}
        {methods.length === 0 && (
          <p className="text-sm text-rose-500">
            {hasDigital ? "This shop can't accept advance payment for digital products right now. Please contact the seller." : "This shop has no payment method enabled."}
          </p>
        )}
        {methods.map((m) => (
          <label key={m.value} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border p-3", method === m.value ? "border-zinc-900 ring-1 ring-zinc-900" : "border-zinc-200")}>
            <input type="radio" value={m.value} {...register("choice")} className="sr-only" />
            <m.icon className="size-5" style={m.color ? { color: m.color } : undefined} />
            <span className="flex-1">
              <span className="block text-sm font-medium">{m.label}</span>
              <span className="text-xs text-zinc-500">{m.hint}</span>
            </span>
            <span className={cn("size-4 rounded-full border-2", method === m.value ? "border-[5px] border-zinc-900" : "border-zinc-300")} />
          </label>
        ))}
        {method === "MANUAL" && (
          <div className="space-y-2 rounded-xl bg-amber-50 p-3 text-sm">
            {manualProviders.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {manualProviders.map((p) => (
                  <button key={p} type="button" onClick={() => setValue("manualProvider", p)} className={cn("rounded-lg px-3 py-1 text-xs font-semibold", manualProvider === p ? "bg-zinc-900 text-white" : "bg-white")}>
                    {MANUAL_PROVIDERS[p].label}
                  </button>
                ))}
              </div>
            )}
            {manualNumber && (
              <p className="whitespace-pre-line">
                Send <b>{formatMoney(total, store.currency)}</b> to <b className="font-mono">{manualNumber}</b> ({manualProvider ? MANUAL_PROVIDERS[manualProvider as ManualProvider].label : ""})
              </p>
            )}
            {store.payment.manualAccounts.instructions && <p className="text-xs text-zinc-600">{store.payment.manualAccounts.instructions}</p>}
            <input
              {...register("manualSender")}
              placeholder={manualProvider === "bank" ? "Your bank / account name" : manualProvider === "upi" ? "Your UPI ID" : "Your sender number"}
              className={inputCls}
            />
            <input {...register("manualTrxId")} placeholder={manualProvider === "upi" ? "UPI reference (UTR)" : "Transaction ID / reference"} className={inputCls} />
            {errors.manualTrxId && <p className="text-xs text-rose-500">{errors.manualTrxId.message}</p>}
          </div>
        )}
      </section>

      <section className="space-y-1.5 rounded-3xl bg-white p-4 text-sm shadow-sm ring-1 ring-black/5">
        <div className="flex justify-between">
          <span className="text-zinc-500">Subtotal</span>
          <span>{formatMoney(subtotal, store.currency)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Delivery</span>
          <span>{shipping === 0 ? "Free" : formatMoney(shipping, store.currency)}</span>
        </div>
        <div className="flex justify-between border-t border-zinc-100 pt-2 text-base font-bold">
          <span>Total</span>
          <span>{formatMoney(total, store.currency)}</span>
        </div>
      </section>

      {serverError && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-600">{serverError}</p>}
      <button type="submit" disabled={isSubmitting || methods.length === 0} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 py-4 text-base font-semibold text-white disabled:opacity-60">
        {isSubmitting && <Loader2 className="size-5 animate-spin" />}
        {method === "COD" || method === "MANUAL" ? "Confirm order" : "Pay"} · {formatMoney(total, store.currency)}
      </button>
    </form>
  );
}
