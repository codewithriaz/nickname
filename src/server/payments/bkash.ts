import "server-only";
import { absoluteUrl } from "@/config/site";
import { paymentError } from "../http/errors";
import {
  majorToMinor,
  toMajorString,
  type BkashCredentials,
  type InitPaymentParams,
  type InitPaymentResult,
  type VerifiedPayment,
} from "./types";

/** bKash Tokenized Checkout (v1.2.0-beta) — https://developer.bka.sh */
const baseUrl = (sandbox: boolean) =>
  sandbox ? "https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout" : "https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout";

const tokenCache = new Map<string, { token: string; expiresAt: number }>();

async function grantToken(creds: BkashCredentials) {
  const key = `${creds.appKey}:${creds.sandbox}`;
  const cached = tokenCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.token;
  const res = await fetch(`${baseUrl(creds.sandbox)}/token/grant`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", username: creds.username, password: creds.password },
    body: JSON.stringify({ app_key: creds.appKey, app_secret: creds.appSecret }),
  });
  const json = (await res.json().catch(() => ({}))) as { id_token?: string; expires_in?: number; statusMessage?: string };
  if (!json.id_token) throw paymentError(`bKash: ${json.statusMessage || "token grant failed"}`);
  tokenCache.set(key, { token: json.id_token, expiresAt: Date.now() + ((json.expires_in ?? 3600) - 120) * 1000 });
  return json.id_token;
}

async function call<T>(creds: BkashCredentials, path: string, body: unknown) {
  const token = await grantToken(creds);
  const res = await fetch(`${baseUrl(creds.sandbox)}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: token, "X-App-Key": creds.appKey },
    body: JSON.stringify(body),
  });
  return (await res.json().catch(() => ({}))) as T;
}

export async function bkashCreate(creds: BkashCredentials, p: InitPaymentParams): Promise<InitPaymentResult> {
  const json = await call<{ paymentID?: string; bkashURL?: string; statusMessage?: string; errorMessage?: string }>(creds, "/create", {
    mode: "0011",
    payerReference: p.customer.phone || "N/A",
    callbackURL: p.callbackBase ?? absoluteUrl(`/api/payments/bkash/callback?kind=${p.kind}&tran=${encodeURIComponent(p.transactionId)}`),
    amount: toMajorString(p.amount),
    currency: "BDT",
    intent: "sale",
    merchantInvoiceNumber: p.transactionId,
  });
  if (!json.bkashURL || !json.paymentID) throw paymentError(`bKash: ${json.statusMessage || json.errorMessage || "could not start payment"}`);
  return { redirectUrl: json.bkashURL, gatewayRef: json.paymentID };
}

export async function bkashExecute(creds: BkashCredentials, paymentId: string): Promise<VerifiedPayment> {
  type Res = { transactionStatus?: string; trxID?: string; amount?: string; merchantInvoiceNumber?: string; statusMessage?: string };
  let json = await call<Res>(creds, "/execute", { paymentID: paymentId });
  // If execute timed out/was already executed, fall back to query.
  if (!json.transactionStatus) json = await call<Res>(creds, "/payment/status", { paymentID: paymentId });
  return {
    ok: json.transactionStatus === "Completed",
    transactionId: json.merchantInvoiceNumber ?? "",
    amount: majorToMinor(json.amount ?? 0),
    gatewayRef: json.trxID ?? paymentId,
    raw: json as Record<string, unknown>,
  };
}
