"use client";

import { MessageCircle, Phone, Printer } from "lucide-react";
import type { OrderDTO } from "@/types/dto";
import type { OrderStatus } from "@/generated/prisma/enums";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { formatMoney } from "@/lib/money";
import { formatDateTime } from "@/lib/dayjs";
import { absoluteUrl, routes } from "@/config/site";
import { useUpdateOrder } from "../../hooks";
import { escapeHtml as e } from "@/lib/utils";
import { paymentMethodLabel } from "@/config/payment-gateways";
import { OrderStatusBadge, PaymentStatusBadge } from "./order-badges";

const NEXT: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "SHIPPED", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "RETURNED"],
  DELIVERED: ["RETURNED"],
};

export function OrderDetail({ order, storeId, username, storeName, onClose }: { order: OrderDTO; storeId: string; username: string; storeName: string; onClose: () => void }) {
  const update = useUpdateOrder(storeId);
  const trackUrl = absoluteUrl(routes.order(username, order.trackingToken));
  const phoneIntl = order.customerPhone.replace(/\D/g, "").replace(/^0/, "880");

  const printInvoice = () => {
    const w = window.open("", "_blank", "width=720,height=900");
    if (!w) return;
    const rows = order.items
      .map((i) => `<tr><td>${e(i.name)}${Object.keys(i.options).length ? ` (${e(Object.entries(i.options).map(([k, v]) => `${k}: ${v}`).join(", "))})` : ""}</td><td>${i.quantity}</td><td style="text-align:right">${formatMoney(i.price * i.quantity, order.currency)}</td></tr>`)
      .join("");
    w.document.write(`<html><head><title>Invoice ${e(order.orderNumber)}</title><style>body{font-family:Arial,sans-serif;padding:32px;color:#111}table{width:100%;border-collapse:collapse}td,th{padding:8px;border-bottom:1px solid #eee;text-align:left}h1{margin:0}</style></head><body>
      <h1>${e(storeName)}</h1><p>Invoice #${e(order.orderNumber)} · ${formatDateTime(order.createdAt)}</p>
      <p><b>${e(order.customerName)}</b><br/>${e(order.customerPhone)}<br/>${e(order.address)}${order.city ? `, ${e(order.city)}` : ""}</p>
      <table><tr><th>Item</th><th>Qty</th><th style="text-align:right">Amount</th></tr>${rows}
      <tr><td colspan="2">Delivery</td><td style="text-align:right">${formatMoney(order.shippingFee, order.currency)}</td></tr>
      <tr><td colspan="2"><b>Total</b></td><td style="text-align:right"><b>${formatMoney(order.total, order.currency)}</b></td></tr></table>
      <p>Payment: ${e(paymentMethodLabel(order.paymentMethod, order.gateway))} (${order.paymentStatus.toLowerCase()})</p></body></html>`);
    w.document.close();
    w.print();
  };

  return (
    <Dialog open side="right" onClose={onClose} title={`Order #${order.orderNumber}`} description={formatDateTime(order.createdAt)}>
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>

        <section className="rounded-2xl bg-muted/60 p-4 text-sm">
          <p className="font-semibold">{order.customerName}</p>
          <p>{order.customerPhone}</p>
          {order.customerEmail && <p>{order.customerEmail}</p>}
          <p className="mt-1 text-muted-foreground">
            {order.address}
            {order.city && `, ${order.city}`} · {order.deliveryZone === "inside" ? "Zone 1" : "Zone 2"}
          </p>
          {order.note && <p className="mt-2 rounded-lg bg-white p-2 text-xs">📝 {order.note}</p>}
          <div className="mt-3 flex gap-2">
            <a href={`tel:${order.customerPhone}`} className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold">
              <Phone className="size-3.5" /> Call
            </a>
            <a href={`https://wa.me/${phoneIntl}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white">
              <MessageCircle className="size-3.5" /> WhatsApp
            </a>
          </div>
        </section>

        <section className="space-y-2 text-sm">
          {order.items.map((i) => (
            <div key={i.id} className="flex items-center gap-3">
              {i.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={i.image} alt="" className="size-10 rounded-lg object-cover" />
              ) : (
                <span className="size-10 rounded-lg bg-muted" />
              )}
              <span className="flex-1">
                {i.name} × {i.quantity}
                {Object.keys(i.options).length > 0 && <span className="block text-xs text-muted-foreground">{Object.entries(i.options).map(([k, v]) => `${k}: ${v}`).join(", ")}</span>}
              </span>
              <span>{formatMoney(i.price * i.quantity, order.currency)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-border pt-2 text-muted-foreground">
            <span>Delivery</span>
            <span>{formatMoney(order.shippingFee, order.currency)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>{formatMoney(order.total, order.currency)}</span>
          </div>
        </section>

        <section className="space-y-2 rounded-2xl border border-border p-4 text-sm">
          <p className="font-semibold">Payment · {paymentMethodLabel(order.paymentMethod, order.gateway)}</p>
          {order.manualPayment && (
            <p className="rounded-lg bg-amber-50 p-2 text-xs">
              {order.manualPayment.provider} from <b>{order.manualPayment.senderNumber}</b> · TrxID <b className="font-mono">{order.manualPayment.trxId}</b>
            </p>
          )}
          {order.transactionId && <p className="font-mono text-xs text-muted-foreground">Txn {order.transactionId}</p>}
          {order.paymentStatus !== "PAID" && (
            <Button size="sm" variant="secondary" loading={update.isPending} onClick={() => update.mutate({ id: order.id, body: { paymentStatus: "PAID", note: "Payment verified" } })}>
              Mark as paid
            </Button>
          )}
        </section>

        {NEXT[order.status] && (
          <section className="space-y-2">
            <p className="text-sm font-semibold">Update status</p>
            <div className="flex flex-wrap gap-2">
              {NEXT[order.status]!.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={s === "CANCELLED" || s === "RETURNED" ? "outline" : "primary"}
                  loading={update.isPending && update.variables?.body.status === s}
                  onClick={() => update.mutate({ id: order.id, body: { status: s } })}
                >
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </Button>
              ))}
            </div>
          </section>
        )}

        <section>
          <p className="mb-2 text-sm font-semibold">History</p>
          <ol className="space-y-2 border-l-2 border-border pl-4 text-xs">
            {order.history.map((h, i) => (
              <li key={i}>
                <b className="capitalize">{h.status.toLowerCase()}</b> · {formatDateTime(h.at)}
                {h.note && <span className="block text-muted-foreground">{h.note}</span>}
              </li>
            ))}
          </ol>
        </section>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={printInvoice}>
            <Printer className="size-4" /> Print invoice
          </Button>
          <CopyButton value={trackUrl} label="Copy tracking link" />
        </div>
      </div>
    </Dialog>
  );
}
