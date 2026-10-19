import "server-only";
import { constants, privateDecrypt, publicEncrypt, randomBytes, sign } from "node:crypto";
import { dayjs } from "@/lib/dayjs";
import { paymentError } from "../../http/errors";
import { majorToMinor, toMajorString, type GatewayAdapter } from "../types";

/**
 * Nagad Online Payment Gateway (merchant API v-0.2.0).
 * Request payloads are RSA-encrypted with Nagad's public key and signed (SHA256withRSA) with the merchant key.
 * ⚠️ Verify against Nagad's latest merchant integration guide before going live.
 */
const baseUrl = (sandbox: boolean) =>
  sandbox ? "http://sandbox.mynagad.com:10080/remote-payment-gateway-1.0/api/dfs" : "https://api.mynagad.com/api/dfs";

function toPem(key: string, type: "PUBLIC" | "PRIVATE") {
  const k = key.trim();
  if (k.includes("BEGIN")) return k;
  const body = k.replace(/\s+/g, "").match(/.{1,64}/g)?.join("\n") ?? "";
  return `-----BEGIN ${type} KEY-----\n${body}\n-----END ${type} KEY-----`;
}

const encrypt = (nagadPublicKey: string, data: object) =>
  publicEncrypt({ key: toPem(nagadPublicKey, "PUBLIC"), padding: constants.RSA_PKCS1_PADDING }, Buffer.from(JSON.stringify(data))).toString("base64");

const signData = (merchantPrivateKey: string, data: object) =>
  sign("sha256", Buffer.from(JSON.stringify(data)), toPem(merchantPrivateKey, "PRIVATE")).toString("base64");

/** PKCS#1 v1.5 decryption done manually (Node 22 disables RSA_PKCS1_PADDING for privateDecrypt). */
function decrypt(merchantPrivateKey: string, b64: string) {
  const raw = privateDecrypt({ key: toPem(merchantPrivateKey, "PRIVATE"), padding: constants.RSA_NO_PADDING }, Buffer.from(b64, "base64"));
  if (raw[0] !== 0x00 || raw[1] !== 0x02) throw paymentError("Nagad: invalid response encryption");
  const sep = raw.indexOf(0x00, 2);
  if (sep < 10) throw paymentError("Nagad: invalid response padding");
  return JSON.parse(raw.subarray(sep + 1).toString("utf8")) as Record<string, string>;
}

const headers = (ip?: string) => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  "X-KM-Api-Version": "v-0.2.0",
  "X-KM-IP-V4": ip && /^\d+\.\d+\.\d+\.\d+$/.test(ip) ? ip : "127.0.0.1",
  "X-KM-Client-Type": "PC_WEB",
});

export const nagadAdapter: GatewayAdapter = {
  async init(c, p, sandbox) {
    const orderId = p.transactionId.replace(/[^A-Za-z0-9]/g, "").slice(0, 20);
    const datetime = dayjs().tz("Asia/Dhaka").format("YYYYMMDDHHmmss");
    const challenge = randomBytes(20).toString("hex");
    const initData = { merchantId: c.merchantId, datetime, orderId, challenge };
    const initRes = await fetch(`${baseUrl(sandbox)}/check-out/initialize/${c.merchantId}/${orderId}`, {
      method: "POST",
      headers: headers(p.clientIp),
      body: JSON.stringify({
        accountNumber: c.merchantNumber || undefined,
        dateTime: datetime,
        sensitiveData: encrypt(c.nagadPublicKey, initData),
        signature: signData(c.merchantPrivateKey, initData),
      }),
    });
    const init = (await initRes.json().catch(() => ({}))) as { sensitiveData?: string; message?: string; reason?: string };
    if (!init.sensitiveData) throw paymentError(`Nagad: ${init.message || init.reason || "initialize failed"}`);
    const decoded = decrypt(c.merchantPrivateKey, init.sensitiveData);

    const completeData = {
      merchantId: c.merchantId,
      orderId,
      currencyCode: "050",
      amount: toMajorString(p.amount),
      challenge: decoded.challenge,
    };
    const completeRes = await fetch(`${baseUrl(sandbox)}/check-out/complete/${decoded.paymentReferenceId}`, {
      method: "POST",
      headers: headers(p.clientIp),
      body: JSON.stringify({
        sensitiveData: encrypt(c.nagadPublicKey, completeData),
        signature: signData(c.merchantPrivateKey, completeData),
        merchantCallbackURL: p.callbackBase,
        additionalMerchantInfo: { transactionId: p.transactionId },
      }),
    });
    const complete = (await completeRes.json().catch(() => ({}))) as { status?: string; callBackUrl?: string; message?: string };
    if (complete.status !== "Success" || !complete.callBackUrl) throw paymentError(`Nagad: ${complete.message || "could not start payment"}`);
    return { redirectUrl: complete.callBackUrl, gatewayRef: decoded.paymentReferenceId };
  },

  async verify(_c, params, ctx) {
    const ref = params.payment_ref_id;
    if (!ref || params.status !== "Success") return { ok: false, transactionId: ctx.transactionId, amount: 0, gatewayRef: ref ?? null, raw: params };
    const res = await fetch(`${baseUrl(ctx.sandbox)}/verify/payment/${ref}`, { headers: headers(), cache: "no-store" });
    const json = (await res.json().catch(() => ({}))) as { status?: string; amount?: string; orderId?: string; issuerPaymentRefNo?: string };
    const expectedOrderId = ctx.transactionId.replace(/[^A-Za-z0-9]/g, "").slice(0, 20);
    return {
      ok: json.status === "Success" && (!json.orderId || json.orderId === expectedOrderId),
      transactionId: ctx.transactionId,
      amount: majorToMinor(json.amount ?? 0),
      gatewayRef: json.issuerPaymentRefNo ?? ref,
      raw: json as Record<string, unknown>,
    };
  },
};
