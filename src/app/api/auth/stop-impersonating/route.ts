import { NextResponse } from "next/server";
import { authed } from "@/server/http/handler";
import { clientIp, userAgent } from "@/server/http/request";
import { badRequest } from "@/server/http/errors";
import { setAuthCookies } from "@/server/auth/cookies";
import { createSession } from "@/server/auth/session";
import { db } from "@/server/db";

/** Super admin returns to their own account after "login as user". */
export const POST = authed(async (req, { auth }) => {
  if (!auth.impersonatorId) throw badRequest("Not impersonating");
  await db.session.update({ where: { id: auth.sessionId }, data: { revokedAt: new Date() } });
  const tokens = await createSession(auth.impersonatorId, { ip: clientIp(req), userAgent: userAgent(req) });
  return setAuthCookies(NextResponse.json({ success: true, data: { ok: true } }), tokens);
});
