import "server-only";
import { createHmac } from "node:crypto";
import { dayjs } from "@/lib/dayjs";
import { majorToMinor, toMajorString, withStatus, type GatewayAdapter } from "../types";

/**
 * 2Checkout (Verifone) ConvertPlus buy-link + REST API 6.0 order lookup.
 * ⚠️ Beta — confirm signature parameters with your 2Checkout account (Integrations → Webhooks & API) before going live.
 */
function buyLinkSignature(params: Record<string, string>, secretWord: string) {
  // Signed params: sorted by key, each value serialised as `${byteLength}${value}`.
  const signed = ["currency", "dynamic", "order-ext-ref", "price", "prod", "qty", "return-type", "return-url", "type"];
  const serialized = signed
    .filter((k) => params[k] !== undefined)
    .sort()
    .map((k) => `${Buffer.byteLength(params[k])}${params[k]}`)
    .join("");
  return createHmac("sha256", secretWord).update(serialized).digest("hex");
}

function apiAuthHeader(code: string, secret: string) {
  const date = dayjs().utc().format("YYYY-MM-DD HH:mm:ss");
  const hash = createHmac("sha256", secret).update(`${code.length}${code}${date.length}${date}`).digest("hex");
  return `code="${code}" date="${date}" hash="${hash}" algo="sha256"`;
}

export const twocheckoutAdapter: GatewayAdapter = {
  async init(c, p, sandbox) {
    const params: Record<string, string> = {
      merchant: c.merchantCode,
      dynamic: "1",
      prod: p.productName.slice(0, 100) || "Order",
      price: toMajorString(p.amount),
      qty: "1",
      type: "PRODUCT",
      currency: p.currency,
      "return-url": withStatus(p.callbackBase, "success"),
      "return-type": "redirect",
      "order-ext-ref": p.transactionId,
      ...(sandbox ? { test: "1" } : {}),
    };
    params.signature = buyLinkSignature(params, c.buyLinkSecret);
    return { redirectUrl: `https://secure.2checkout.com/checkout/buy?${new URLSearchParams(params)}` };
  },
  async verify(c, params, ctx) {
    const refNo = params.refno || params.REFNO;
    if (!refNo) return { ok: false, transactionId: ctx.transactionId, amount: 0, gatewayRef: null, raw: params };
    const res = await fetch(`https://api.2checkout.com/rest/6.0/orders/${encodeURIComponent(refNo)}/`, {
      headers: { "X-Avangate-Authentication": apiAuthHeader(c.merchantCode, c.secretKey), Accept: "application/json" },
      cache: "no-store",
    });
    const json = (await res.json().catch(() => ({}))) as { Status?: string; ExternalReference?: string; GrossPrice?: number; Currency?: string };
    return {
      ok: ["AUTHRECEIVED", "COMPLETE"].includes(json.Status ?? "") && json.ExternalReference === ctx.transactionId && (json.Currency ?? "").toUpperCase() === ctx.currency,
      transactionId: ctx.transactionId,
      amount: majorToMinor(json.GrossPrice ?? 0),
      gatewayRef: refNo,
      raw: json as Record<string, unknown>,
    };
  },
};
