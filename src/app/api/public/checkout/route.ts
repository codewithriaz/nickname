import { handler } from "@/server/http/handler";
import { clientIp, parseBody } from "@/server/http/request";
import { rateLimit } from "@/server/http/rate-limit";
import { created } from "@/server/http/response";
import { checkoutSchema } from "@/schemas/shop";
import { placeOrder } from "@/server/services/order.service";
import { recordEvent } from "@/server/analytics/track";
import { db } from "@/server/db";

export const POST = handler(async (req) => {
  rateLimit(`checkout:${clientIp(req)}`, 15, 60 * 60 * 1000);
  const input = await parseBody(req, checkoutSchema);
  const result = await placeOrder(input, { ip: clientIp(req) });
  const store = await db.store.findUnique({ where: { id: input.storeId }, select: { profileId: true } });
  if (store) await recordEvent(req, { type: "ORDER_PLACED", profileId: store.profileId });
  return created(result);
});
