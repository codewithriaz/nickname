import "server-only";
import { sslcommerzValidate } from "./sslcommerz";
import { bkashExecute } from "./bkash";
import { platformBkash, platformSslCommerz } from "./credentials";
import { failOrderPayment, settleOrderGateway } from "../services/order.service";
import { completeBillingPayment, failBillingPayment } from "../services/billing.service";
import type { PaymentKind } from "./types";
import { absoluteUrl } from "@/config/site";

/**
 * Legacy/platform callback helpers for /api/payments/sslcommerz/* and /api/payments/bkash/*.
 * Subscription billing uses platform (env) credentials. Shop orders are delegated to the generic
 * gateway flow (`settleOrderGateway`) — new orders call back to /api/payments/gateway/[key]/[tran].
 */
export async function settleSslCommerz(kind: PaymentKind, tran: string, valId: string | null) {
  if (kind === "order") return settleOrderGateway("sslcommerz", tran, { val_id: valId ?? "", status: valId ? "success" : "fail" });
  if (!valId) return failBillingPayment(tran, "FAILED");
  const creds = platformSslCommerz();
  if (!creds) return absoluteUrl("/");
  const verified = await sslcommerzValidate(creds, valId);
  if (verified.transactionId !== tran) verified.ok = false;
  return completeBillingPayment({ ...verified, transactionId: tran });
}

export async function settleBkash(kind: PaymentKind, tran: string, paymentId: string) {
  if (kind === "order") return settleOrderGateway("bkash", tran, { paymentID: paymentId, status: "success" });
  const creds = platformBkash();
  if (!creds) return absoluteUrl("/");
  const verified = await bkashExecute(creds, paymentId);
  if (verified.transactionId && verified.transactionId !== tran) verified.ok = false;
  return completeBillingPayment({ ...verified, transactionId: tran });
}

export const failPayment = (kind: PaymentKind, tran: string, cancelled: boolean) =>
  kind === "order" ? failOrderPayment(tran) : failBillingPayment(tran, cancelled ? "CANCELED" : "FAILED");
