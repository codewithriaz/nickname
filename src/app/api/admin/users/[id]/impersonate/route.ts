import { NextResponse } from "next/server";
import { adminOnly } from "@/server/http/handler";
import { clientIp, userAgent } from "@/server/http/request";
import { badRequest } from "@/server/http/errors";
import { setAuthCookies } from "@/server/auth/cookies";
import { createSession } from "@/server/auth/session";
import { audit } from "@/server/services/audit.service";

/** "Login as user" for support. The session remembers the admin so they can switch back. */
export const POST = adminOnly<{ id: string }>(async (req, { auth, params }) => {
  if (params.id === auth.userId) throw badRequest("Already logged in as yourself");
  const tokens = await createSession(params.id, { ip: clientIp(req), userAgent: userAgent(req), impersonatorId: auth.userId });
  await audit(auth.userId, "user.impersonate", "User", params.id);
  return setAuthCookies(NextResponse.json({ success: true, data: { ok: true } }), tokens);
});
