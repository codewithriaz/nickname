import "server-only";
import { paymentError } from "../../http/errors";
import { withStatus, type GatewayAdapter } from "../types";

/** Stripe Checkout Sessions (hosted page) — https://docs.stripe.com/api/checkout/sessions */
const headers = (c: Record<string, string>) => ({ Authorization: `Bearer ${c.secretKey}`, "Content-Type": "application/x-www-form-urlencoded" });

export const stripeAdapter: GatewayAdapter = {
  async init(c, p) {
    const success = `${withStatus(p.callbackBase, "success")}&session_id={CHECKOUT_SESSION_ID}`;
    const body = new URLSearchParams({
      mode: "payment",
      success_url: success,
      cancel_url: withStatus(p.callbackBase, "cancel"),
      client_reference_id: p.transactionId,
      "metadata[transactionId]": p.transactionId,
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": p.currency.toLowerCase(),
      "line_items[0][price_data][unit_amount]": String(p.amount),
      "line_items[0][price_data][product_data][name]": p.productName.slice(0, 250) || "Order",
      ...(p.customer.email ? { customer_email: p.customer.email } : {}),
    });
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: headers(c), body });
    const json = (await res.json().catch(() => ({}))) as { id?: string; url?: string; error?: { message?: string } };
    if (!json.url) throw paymentError(`Stripe: ${json.error?.message || "could not start payment"}`);
    return { redirectUrl: json.url, gatewayRef: json.id };
  },
  async verify(c, params, ctx) {
    const sessionId = params.session_id || ctx.gatewayRef;
    if (!sessionId) return { ok: false, transactionId: ctx.transactionId, amount: 0, gatewayRef: null, raw: params };
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, { headers: headers(c), cache: "no-store" });
    const json = (await res.json().catch(() => ({}))) as { payment_status?: string; amount_total?: number; client_reference_id?: string; currency?: string; payment_intent?: string };
    return {
      ok: json.payment_status === "paid" && json.client_reference_id === ctx.transactionId && json.currency === ctx.currency.toLowerCase(),
      transactionId: ctx.transactionId,
      amount: json.amount_total ?? 0,
      gatewayRef: json.payment_intent ?? sessionId,
      raw: json as Record<string, unknown>,
    };
  },
};
