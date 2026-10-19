import type { NextRequest } from "next/server";
import { settleSslCommerz } from "@/server/payments/settle";

/** Server-to-server Instant Payment Notification. */
export async function POST(req: NextRequest) {
  const kind = req.nextUrl.searchParams.get("kind") === "billing" ? "billing" : "order";
  const form = await req.formData().catch(() => null);
  const valId = (form?.get("val_id") as string) ?? null;
  const tran = (form?.get("tran_id") as string) ?? "";
  if (valId && tran) {
    try {
      await settleSslCommerz(kind, tran, valId);
    } catch (e) {
      console.error("[sslcommerz] IPN failed", e);
    }
  }
  return new Response("OK");
}
