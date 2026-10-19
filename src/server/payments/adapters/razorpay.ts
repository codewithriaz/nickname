import "server-only";
import { paymentError } from "../../http/errors";
import type { GatewayAdapter } from "../types";

/** Razorpay Payment Links (redirect flow) — https://razorpay.com/docs/api/payments/payment-links/ */
const auth = (c: Record<string, string>) => `Basic ${Buffer.from(`${c.keyId}:${c.keySecret}`).toString("base64")}`;

export const razorpayAdapter: GatewayAdapter = {
  async init(c, p) {
    const res = await fetch("https://api.razorpay.com/v1/payment_links", {
      method: "POST",
      headers: { Authorization: auth(c), "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: p.amount,
        currency: p.currency,
        accept_partial: false,
        reference_id: p.transactionId.slice(0, 40),
        description: p.productName.slice(0, 2048),
        customer: { name: p.customer.name, contact: p.customer.phone, email: p.customer.email || undefined },
        notify: { sms: false, email: false },
        callback_url: p.callbackBase,
        callback_method: "get",
      }),
    });
    const json = (await res.json().catch(() => ({}))) as { id?: string; short_url?: string; error?: { description?: string } };
    if (!json.short_url) throw paymentError(`Razorpay: ${json.error?.description || "could not start payment"}`);
    return { redirectUrl: json.short_url, gatewayRef: json.id };
  },
  async verify(c, params, ctx) {
    const linkId = params.razorpay_payment_link_id || ctx.gatewayRef;
    if (!linkId) return { ok: false, transactionId: ctx.transactionId, amount: 0, gatewayRef: null, raw: params };
    const res = await fetch(`https://api.razorpay.com/v1/payment_links/${linkId}`, { headers: { Authorization: auth(c) }, cache: "no-store" });
    const json = (await res.json().catch(() => ({}))) as { status?: string; amount_paid?: number; reference_id?: string; currency?: string };
    return {
      ok: json.status === "paid" && json.reference_id === ctx.transactionId.slice(0, 40) && json.currency === ctx.currency,
      transactionId: ctx.transactionId,
      amount: json.amount_paid ?? 0,
      gatewayRef: params.razorpay_payment_id || linkId,
      raw: json as Record<string, unknown>,
    };
  },
};
