import { authed } from "@/server/http/handler";
import { parseBody } from "@/server/http/request";
import { ok } from "@/server/http/response";
import { changePasswordSchema } from "@/schemas/auth";
import { changePassword } from "@/server/services/auth.service";

export const POST = authed(async (req, { auth }) => {
  await changePassword(auth.userId, auth.sessionId, await parseBody(req, changePasswordSchema));
  return ok({ changed: true });
});
