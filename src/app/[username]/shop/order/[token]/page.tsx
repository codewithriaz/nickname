import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CheckCircle2, Circle, Download, XCircle } from "lucide-react";
import { getOrderByToken } from "@/server/services/order.service";
import { formatMoney } from "@/lib/money";
import { formatDateTime } from "@/lib/dayjs";
import { ORDER_STATUS_FLOW } from "@/schemas/shop";
import { cn } from "@/lib/utils";
import { routes } from "@/config/site";
import { paymentMethodLabel } from "@/config/payment-gateways";

export const metadata = { title: "Order status", robots: { index: false } };

const PAYMENT_LABEL = { UNPAID: "Unpaid", PENDING_VERIFICATION: "Verifying payment", PAID: "Paid", FAILED: "Payment failed", REFUNDED: "Refunded" } as const;

/** SSR: always fresh order status (request-time, not cached). */
async function OrderContent({ params }: { params: PageProps<"/[username]/shop/order/[token]">["params"] }) {
  const { token, username } = await params;
  const result = await getOrderByToken(token);
  if (!result) notFound();
  const { order, store, digitalDownloads } = result;
  const cancelled = order.status === "CANCELLED" || order.status === "RETURNED";
  const currentIdx = ORDER_STATUS_FLOW.indexOf(order.status);

  return (
    <main className="mx-auto max-w-lg px-4 py-8 text-zinc-900">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="text-center">
          {cancelled ? <XCircle className="mx-auto size-12 text-rose-500" /> : <CheckCircle2 className="mx-auto size-12 text-emerald-500" />}
          <h1 className="mt-3 text-xl font-bold">{cancelled ? `Order ${order.status.toLowerCase()}` : "Thank you for your order!"}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Order <b className="font-mono text-zinc-900">#{order.orderNumber}</b> · {store.name}
          </p>
          <p className="mt-1 text-xs text-zinc-400">Save this page link to track your order.</p>
        </div>

        {!cancelled && (
          <ol className="mt-6 space-y-3">
            {ORDER_STATUS_FLOW.map((s, i) => {
              const done = i <= currentIdx;
              const at = order.history.find((h) => h.status === s)?.at;
              return (
                <li key={s} className="flex items-center gap-3 text-sm">
                  {done ? <CheckCircle2 className="size-5 text-emerald-500" /> : <Circle className="size-5 text-zinc-300" />}
                  <span className={cn("flex-1 capitalize", done ? "font-medium" : "text-zinc-400")}>{s.toLowerCase()}</span>
                  {at && <span className="text-xs text-zinc-400">{formatDateTime(at)}</span>}
                </li>
              );
            })}
          </ol>
        )}

        <div className="mt-6 space-y-2 border-t border-zinc-100 pt-4 text-sm">
          {order.items.map((i) => (
            <div key={i.id} className="flex justify-between gap-3">
              <span>
                {i.name} × {i.quantity}
                {Object.keys(i.options).length > 0 && <span className="block text-xs text-zinc-500">{Object.entries(i.options).map(([k, v]) => `${k}: ${v}`).join(", ")}</span>}
              </span>
              <span>{formatMoney(i.price * i.quantity, order.currency)}</span>
            </div>
          ))}
          <div className="flex justify-between text-zinc-500">
            <span>Delivery</span>
            <span>{formatMoney(order.shippingFee, order.currency)}</span>
          </div>
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span>{formatMoney(order.total, order.currency)}</span>
          </div>
          <div className="flex justify-between text-zinc-500">
            <span>Payment</span>
            <span>
              {paymentMethodLabel(order.paymentMethod, order.gateway)} · {PAYMENT_LABEL[order.paymentStatus]}
            </span>
          </div>
        </div>

        {digitalDownloads.length > 0 && (
          <div className="mt-4 space-y-2">
            {digitalDownloads.map((d) => (
              <a key={d.url} href={d.url} className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white">
                <Download className="size-4" /> Download {d.name}
              </a>
            ))}
          </div>
        )}

        <div className="mt-4 rounded-2xl bg-zinc-50 p-3 text-xs text-zinc-600">
          <p className="font-medium text-zinc-900">Delivery to</p>
          <p>
            {order.customerName} · {order.customerPhone}
          </p>
          <p>
            {order.address}
            {order.city && `, ${order.city}`}
          </p>
        </div>
        <a href={routes.shop(username)} className="mt-5 block text-center text-sm font-semibold text-zinc-900 underline">
          Back to shop
        </a>
      </div>
    </main>
  );
}

export default function OrderPage(props: PageProps<"/[username]/shop/order/[token]">) {
  return (
    <div className="min-h-dvh bg-zinc-50">
      <Suspense fallback={<div className="mx-auto mt-8 h-96 max-w-lg animate-pulse rounded-3xl bg-white" />}>
        <OrderContent params={props.params} />
      </Suspense>
    </div>
  );
}
