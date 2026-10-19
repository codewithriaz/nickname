import "server-only";
import { paymentError } from "../../http/errors";
import { majorToMinor, toMajorString, withStatus, type GatewayAdapter } from "../types";

/** PayPal Orders v2 (redirect + capture) — https://developer.paypal.com/docs/api/orders/v2/ */
const base = (sandbox: boolean) => (sandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com");

async function token(c: Record<string, string>, sandbox: boolean) {
  const res = await fetch(`${base(sandbox)}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${c.clientId}:${c.clientSecret}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  const json = (await res.json().catch(() => ({}))) as { access_token?: string; error_description?: string };
  if (!json.access_token) throw paymentError(`PayPal: ${json.error_description || "authentication failed"}`);
  return json.access_token;
}

type PaypalOrder = {
  id?: string;
  status?: string;
  links?: { rel: string; href: string }[];
  purchase_units?: { custom_id?: string; payments?: { captures?: { id: string; status: string; amount: { value: string; currency_code: string } }[] } }[];
  message?: string;
  details?: { issue?: string }[];
};

export const paypalAdapter: GatewayAdapter = {
  async init(c, p, sandbox) {
    const res = await fetch(`${base(sandbox)}/v2/checkout/orders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${await token(c, sandbox)}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: p.transactionId,
            custom_id: p.transactionId,
            description: p.productName.slice(0, 127),
            amount: { currency_code: p.currency, value: toMajorString(p.amount) },
          },
        ],
        application_context: {
          return_url: withStatus(p.callbackBase, "success"),
          cancel_url: withStatus(p.callbackBase, "cancel"),
          user_action: "PAY_NOW",
          shipping_preference: "NO_SHIPPING",
        },
      }),
    });
    const json = (await res.json().catch(() => ({}))) as PaypalOrder;
    const approve = json.links?.find((l) => l.rel === "approve" || l.rel === "payer-action")?.href;
    if (!approve) throw paymentError(`PayPal: ${json.details?.[0]?.issue || json.message || "could not start payment"}`);
    return { redirectUrl: approve, gatewayRef: json.id };
  },
  async verify(c, params, ctx) {
    const orderId = params.token || ctx.gatewayRef;
    if (!orderId) return { ok: false, transactionId: ctx.transactionId, amount: 0, gatewayRef: null, raw: params };
    const auth = { Authorization: `Bearer ${await token(c, ctx.sandbox)}`, "Content-Type": "application/json" };
    let json = (await (await fetch(`${base(ctx.sandbox)}/v2/checkout/orders/${orderId}/capture`, { method: "POST", headers: auth })).json().catch(() => ({}))) as PaypalOrder;
    if (json.details?.[0]?.issue === "ORDER_ALREADY_CAPTURED" || !json.status) {
      json = (await (await fetch(`${base(ctx.sandbox)}/v2/checkout/orders/${orderId}`, { headers: auth, cache: "no-store" })).json().catch(() => ({}))) as PaypalOrder;
    }
    const unit = json.purchase_units?.[0];
    const capture = unit?.payments?.captures?.find((x) => x.status === "COMPLETED");
    return {
      ok: json.status === "COMPLETED" && !!capture && capture.amount.currency_code === ctx.currency && (!unit?.custom_id || unit.custom_id === ctx.transactionId),
      transactionId: ctx.transactionId,
      amount: capture ? majorToMinor(capture.amount.value) : 0,
      gatewayRef: capture?.id ?? orderId,
      raw: json as Record<string, unknown>,
    };
  },
};
