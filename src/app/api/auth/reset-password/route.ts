import { handler } from "@/server/http/handler";
import { clientIp, parseBody } from "@/server/http/request";
import { rateLimit } from "@/server/http/rate-limit";
import { ok } from "@/server/http/response";
import { resetPasswordSchema } from "@/schemas/auth";
import { resetPassword } from "@/server/services/auth.service";

export const POST = handler(async (req) => {
  rateLimit(`reset:${clientIp(req)}`, 10, 60 * 60 * 1000);
  await resetPassword(await parseBody(req, resetPasswordSchema));
  return ok({ reset: true });
});
