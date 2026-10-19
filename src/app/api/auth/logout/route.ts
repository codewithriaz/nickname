import { NextResponse, type NextRequest } from "next/server";
import { handler } from "@/server/http/handler";
import { clearAuthCookies } from "@/server/auth/cookies";
import { revokeSessionByToken } from "@/server/auth/session";
import { REFRESH_COOKIE } from "@/server/auth/constants";

export const POST = handler(async (req: NextRequest) => {
  await revokeSessionByToken(req.cookies.get(REFRESH_COOKIE)?.value);
  return clearAuthCookies(NextResponse.json({ success: true, data: { ok: true } }));
});
