import type { NextRequest } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { GATEWAY_KEYS, type GatewayKey } from "@/config/payment-gateways";
import { settleOrderGateway } from "@/server/services/order.service";
import { absoluteUrl } from "@/config/site";

/**
 * Universal return/callback URL for shop-order payments:
 * /api/payments/gateway/{bkash|nagad|sslcommerz|razorpay|paypal|stripe|twocheckout}/{transactionId}
 * Params from the query string and (for POST callbacks like SSLCommerz) the form body are passed to the adapter,
 * which re-verifies the payment with the gateway's API before the order is marked paid.
 */
async function handle(req: NextRequest, ctx: RouteContext<"/api/payments/gateway/[key]/[tran]">) {
  const { key, tran } = await ctx.params;
  if (!(GATEWAY_KEYS as readonly string[]).includes(key)) return new Response("Unknown gateway", { status: 404 });
  const params: Record<string, string> = Object.fromEntries(req.nextUrl.searchParams.entries());
  if (req.method === "POST") {
    const form = await req.formData().catch(() => null);
    form?.forEach((v, k) => {
      if (typeof v === "string") params[k] = v;
    });
  }
  try {
    const target = await settleOrderGateway(key as GatewayKey, decodeURIComponent(tran), params);
    return Response.redirect(target ?? absoluteUrl("/"), 303);
  } catch (e) {
    unstable_rethrow(e);
    console.error(`[payments:${key}] callback failed`, e);
    return Response.redirect(absoluteUrl("/link-unavailable?reason=payment"), 303);
  }
}

export const GET = handle;
export const POST = handle;
