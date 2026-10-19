import "server-only";
import { env } from "../env";
import { decryptJson } from "../crypto";
import { GATEWAY_KEYS, gatewayDef, type GatewayKey } from "@/config/payment-gateways";
import type { GatewaySecrets } from "@/schemas/shop";
import type { BkashCredentials, SslCommerzCredentials } from "./types";

/** Platform (subscription billing) credentials from env. */
export function platformSslCommerz(): SslCommerzCredentials | null {
  const e = env();
  if (!e.SSLCOMMERZ_STORE_ID || !e.SSLCOMMERZ_STORE_PASSWORD) return null;
  return { storeId: e.SSLCOMMERZ_STORE_ID, storePassword: e.SSLCOMMERZ_STORE_PASSWORD, sandbox: e.SSLCOMMERZ_SANDBOX };
}

export function platformBkash(): BkashCredentials | null {
  const e = env();
  if (!e.BKASH_APP_KEY || !e.BKASH_APP_SECRET || !e.BKASH_USERNAME || !e.BKASH_PASSWORD) return null;
  return {
    appKey: e.BKASH_APP_KEY,
    appSecret: e.BKASH_APP_SECRET,
    username: e.BKASH_USERNAME,
    password: e.BKASH_PASSWORD,
    sandbox: e.BKASH_SANDBOX,
  };
}

/** Legacy flat format (before country-based gateways) → nested `{ gateway: { field } }`. */
function normalize(raw: Record<string, unknown> | null): GatewaySecrets {
  if (!raw) return {};
  if (GATEWAY_KEYS.some((k) => typeof raw[k] === "object")) return raw as GatewaySecrets;
  const s = raw as Record<string, string | undefined>;
  const out: GatewaySecrets = {};
  if (s.sslcommerzStoreId) out.sslcommerz = { storeId: s.sslcommerzStoreId, storePassword: s.sslcommerzStorePassword ?? "" };
  if (s.bkashAppKey)
    out.bkash = { appKey: s.bkashAppKey, appSecret: s.bkashAppSecret ?? "", username: s.bkashUsername ?? "", password: s.bkashPassword ?? "" };
  return out;
}

export function readStoreSecrets(store: { gatewaySecrets: string | null }): GatewaySecrets {
  return normalize(decryptJson<Record<string, unknown>>(store.gatewaySecrets));
}

/** Required fields filled? (optional fields are those labelled "(optional)"). */
export function isGatewayConfigured(key: GatewayKey, creds: Record<string, string> | undefined) {
  const def = gatewayDef(key);
  if (!def || !creds) return false;
  return def.fields.every((f) => f.label.includes("(optional)") || !!creds[f.key]);
}

export function storeGatewayCreds(store: { gatewaySecrets: string | null }, key: GatewayKey) {
  const creds = readStoreSecrets(store)[key];
  return isGatewayConfigured(key, creds) ? (creds as Record<string, string>) : null;
}
