import type { NextRequest } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { absoluteUrl } from "@/config/site";
import { failPayment, settleSslCommerz } from "@/server/payments/settle";

/** SSLCommerz redirects the customer here (POST form) after success / fail / cancel. */
async function handle(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const kind = q.get("kind") === "billing" ? "billing" : "order";
  const status = q.get("status");
  const tran = q.get("tran") ?? "";
  let valId: string | null = null;
  if (req.method === "POST") {
    const form = await req.formData().catch(() => null);
    valId = (form?.get("val_id") as string) ?? null;
  }
  try {
    const target =
      status === "success" ? await settleSslCommerz(kind, tran, valId) : await failPayment(kind, tran, status === "cancel");
    return Response.redirect(target ?? absoluteUrl("/"), 303);
  } catch (e) {
    unstable_rethrow(e);
    console.error("[sslcommerz] callback failed", e);
    return Response.redirect(absoluteUrl(kind === "billing" ? "/dashboard/billing?payment=failed" : "/"), 303);
  }
}

export const POST = handle;
export const GET = handle;
