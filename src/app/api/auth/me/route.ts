import { authed } from "@/server/http/handler";
import { parseBody } from "@/server/http/request";
import { ok } from "@/server/http/response";
import { getMe } from "@/server/services/user.service";
import { updateAccountSchema } from "@/schemas/auth";
import { db } from "@/server/db";

export const GET = authed(async (_req, { auth }) => ok(await getMe(auth.userId, !!auth.impersonatorId)));

export const PATCH = authed(async (req, { auth }) => {
  const input = await parseBody(req, updateAccountSchema);
  await db.user.update({ where: { id: auth.userId }, data: input });
  return ok(await getMe(auth.userId, !!auth.impersonatorId));
});
