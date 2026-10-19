import { z } from "zod";
import { handler } from "@/server/http/handler";
import { clientIp, parseBody } from "@/server/http/request";
import { rateLimit } from "@/server/http/rate-limit";
import { ok } from "@/server/http/response";
import { unlockShortLink } from "@/server/services/short-link.service";
import { recordEvent } from "@/server/analytics/track";

export const POST = handler(async (req) => {
  rateLimit(`unlock:${clientIp(req)}`, 20, 15 * 60 * 1000);
  const { code, password } = await parseBody(req, z.object({ code: z.string().max(40), password: z.string().max(64) }));
  const link = await unlockShortLink(code, password);
  await recordEvent(req, { type: "SHORTLINK_CLICK", shortLinkId: link.id });
  return ok({ destination: link.destination });
});
