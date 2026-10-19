import "server-only";
import type { GatewayKey } from "@/config/payment-gateways";
import type { GatewayAdapter } from "../types";
import { bkashAdapter } from "./bkash";
import { nagadAdapter } from "./nagad";
import { sslcommerzAdapter } from "./sslcommerz";
import { razorpayAdapter } from "./razorpay";
import { paypalAdapter } from "./paypal";
import { stripeAdapter } from "./stripe";
import { twocheckoutAdapter } from "./twocheckout";

/** Gateway key → adapter. Add a gateway: implement GatewayAdapter + register here + add metadata in config/payment-gateways.ts. */
export const ADAPTERS: Record<GatewayKey, GatewayAdapter> = {
  bkash: bkashAdapter,
  nagad: nagadAdapter,
  sslcommerz: sslcommerzAdapter,
  razorpay: razorpayAdapter,
  paypal: paypalAdapter,
  stripe: stripeAdapter,
  twocheckout: twocheckoutAdapter,
};
