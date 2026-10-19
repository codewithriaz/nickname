import type { NextRequest } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { absoluteUrl } from "@/config/site";
import { failPayment, settleBkash } from "@/server/payments/settle";

/** bKash redirects here with ?paymentID=..&status=success|failure|cancel */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const kind = q.get("kind") === "billing" ? "billing" : "order";
  const tran = q.get("tran") ?? "";
  const status = q.get("status");
  const paymentId = q.get("paymentID");
  try {
    const target =
      status === "success" && paymentId ? await settleBkash(kind, tran, paymentId) : await failPayment(kind, tran, status === "cancel");
    return Response.redirect(target ?? absoluteUrl("/"), 303);
  } catch (e) {
    unstable_rethrow(e);
    console.error("[bkash] callback failed", e);
    return Response.redirect(absoluteUrl(kind === "billing" ? "/dashboard/billing?payment=failed" : "/"), 303);
  }
}
