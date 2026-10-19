import type { NextRequest } from "next/server";
import { after } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { clientIp } from "@/server/http/request";
import { recordEvent } from "@/server/analytics/track";

const PUBLIC_EVENTS = ["PAGE_VIEW", "LINK_CLICK", "SHOP_VIEW", "PRODUCT_VIEW", "ADD_TO_CART", "CHECKOUT_START"] as const;

const trackSchema = z.object({
  type: z.enum(PUBLIC_EVENTS),
  profileId: z.string().max(40),
  blockId: z.string().max(40).optional(),
  productId: z.string().max(40).optional(),
  referrer: z.string().max(500).optional(),
  utmSource: z.string().max(80).optional(),
  utmMedium: z.string().max(80).optional(),
  utmCampaign: z.string().max(120).optional(),
});

const hits = new Map<string, number>();

/** Beacon endpoint (navigator.sendBeacon → text/plain JSON). Always 204. */
export async function POST(req: NextRequest) {
  const key = `${clientIp(req)}:${Math.floor(Date.now() / 60000)}`;
  const count = (hits.get(key) ?? 0) + 1;
  hits.set(key, count);
  if (hits.size > 20000) hits.clear();
  if (count > 120) return new Response(null, { status: 204 });

  let body: unknown;
  try {
    body = JSON.parse(await req.text());
  } catch {
    return new Response(null, { status: 204 });
  }
  const parsed = trackSchema.safeParse(body);
  if (!parsed.success) return new Response(null, { status: 204 });
  const input = parsed.data;
  const headers = new Headers(req.headers);

  after(async () => {
    if (input.blockId) {
      const block = await db.block.findFirst({ where: { id: input.blockId, profileId: input.profileId }, select: { id: true } });
      if (!block) return;
    }
    await recordEvent(new Request(req.url, { headers }), input);
  });
  return new Response(null, { status: 204 });
}
