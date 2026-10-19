import type { NextRequest } from "next/server";
import { expireSubscriptions } from "@/server/services/billing.service";

/** Call daily: `curl -H "Authorization: Bearer $CRON_SECRET" https://app/api/cron/expire-subscriptions` */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
  return Response.json({ success: true, data: await expireSubscriptions() });
}
