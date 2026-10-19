import { z } from "zod";
import { handler } from "@/server/http/handler";
import { clientIp, parseBody } from "@/server/http/request";
import { rateLimit } from "@/server/http/rate-limit";
import { ok } from "@/server/http/response";
import { findOrderForTracking } from "@/server/services/order.service";

const schema = z.object({ storeId: z.string().max(40), orderNumber: z.string().trim().min(2).max(40), phone: z.string().trim().min(6).max(20) });

export const POST = handler(async (req) => {
  rateLimit(`track:${clientIp(req)}`, 20, 15 * 60 * 1000);
  const { storeId, orderNumber, phone } = await parseBody(req, schema);
  return ok(await findOrderForTracking(storeId, orderNumber, phone));
});
