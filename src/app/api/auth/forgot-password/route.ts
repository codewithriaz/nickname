import { handler } from "@/server/http/handler";
import { clientIp, parseBody } from "@/server/http/request";
import { rateLimit } from "@/server/http/rate-limit";
import { ok } from "@/server/http/response";
import { forgotPasswordSchema } from "@/schemas/auth";
import { forgotPassword } from "@/server/services/auth.service";

export const POST = handler(async (req) => {
  rateLimit(`forgot:${clientIp(req)}`, 5, 60 * 60 * 1000);
  await forgotPassword(await parseBody(req, forgotPasswordSchema));
  return ok({ sent: true });
});
