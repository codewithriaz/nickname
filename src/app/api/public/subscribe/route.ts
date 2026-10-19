import { handler } from "@/server/http/handler";
import { clientIp, parseBody } from "@/server/http/request";
import { rateLimit } from "@/server/http/rate-limit";
import { ok } from "@/server/http/response";
import { subscribeSchema } from "@/schemas/profile";
import { subscribe } from "@/server/services/subscriber.service";
import { recordEvent } from "@/server/analytics/track";

export const POST = handler(async (req) => {
  rateLimit(`subscribe:${clientIp(req)}`, 20, 60 * 60 * 1000);
  const input = await parseBody(req, subscribeSchema);
  const result = await subscribe(input);
  await recordEvent(req, { type: "SUBSCRIBE", profileId: input.profileId, blockId: input.blockId });
  return ok(result);
});
