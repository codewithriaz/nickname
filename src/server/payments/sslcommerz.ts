import "server-only";
import { absoluteUrl } from "@/config/site";
import { paymentError } from "../http/errors";
import {
  withStatus,
  majorToMinor,
  toMajorString,
  type InitPaymentParams,
  type InitPaymentResult,
  type SslCommerzCredentials,
  type VerifiedPayment,
} from "./types";

/** SSLCommerz v4 — https://developer.sslcommerz.com/doc/v4/ */
const baseUrl = (sandbox: boolean) => (sandbox ? "https://sandbox.sslcommerz.com" : "https://securepay.sslcommerz.com");

export async function sslcommerzInit(creds: SslCommerzCredentials, p: InitPaymentParams): Promise<InitPaymentResult> {
  const callback = (status: string) =>
    p.callbackBase
      ? withStatus(p.callbackBase, status)
      : absoluteUrl(`/api/payments/sslcommerz/callback?kind=${p.kind}&status=${status}&tran=${encodeURIComponent(p.transactionId)}`);
  const body = new URLSearchParams({
    store_id: creds.storeId,
    store_passwd: creds.storePassword,
    total_amount: toMajorString(p.amount),
    currency: p.currency,
    tran_id: p.transactionId,
    success_url: callback("success"),
    fail_url: callback("fail"),
    cancel_url: callback("cancel"),
    ipn_url: absoluteUrl(`/api/payments/sslcommerz/ipn?kind=${p.kind}`),
    cus_name: p.customer.name,
    cus_email: p.customer.email || "customer@example.com",
    cus_add1: p.customer.address || "N/A",
    cus_city: p.customer.city || "Dhaka",
    cus_country: "Bangladesh",
    cus_phone: p.customer.phone,
    shipping_method: "NO",
    product_name: p.productName.slice(0, 250),
    product_category: p.kind === "order" ? "ecommerce" : "subscription",
    product_profile: p.kind === "order" ? "physical-goods" : "non-physical-goods",
    value_a: p.kind,
  });
  const res = await fetch(`${baseUrl(creds.sandbox)}/gwprocess/v4/api.php`, { method: "POST", body });
  const json = (await res.json().catch(() => ({}))) as { status?: string; GatewayPageURL?: string; failedreason?: string; sessionkey?: string };
  if (json.status !== "SUCCESS" || !json.GatewayPageURL) {
    throw paymentError(`SSLCommerz: ${json.failedreason || "could not start payment"}`);
  }
  return { redirectUrl: json.GatewayPageURL, gatewayRef: json.sessionkey };
}

/** Validate a val_id returned to success/IPN URLs with the Order Validation API. */
export async function sslcommerzValidate(creds: SslCommerzCredentials, valId: string): Promise<VerifiedPayment> {
  const url = new URL(`${baseUrl(creds.sandbox)}/validator/api/validationserverAPI.php`);
  url.search = new URLSearchParams({
    val_id: valId,
    store_id: creds.storeId,
    store_passwd: creds.storePassword,
    format: "json",
  }).toString();
  const res = await fetch(url, { cache: "no-store" });
  const json = (await res.json().catch(() => ({}))) as Record<string, string>;
  const ok = json.status === "VALID" || json.status === "VALIDATED";
  return {
    ok,
    transactionId: json.tran_id ?? "",
    amount: majorToMinor(json.amount ?? 0),
    gatewayRef: json.bank_tran_id ?? valId,
    raw: json,
  };
}
