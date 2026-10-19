import { NextResponse, type NextRequest } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { toErrorResponse } from "@/server/http/handler";
import { clientIp, userAgent } from "@/server/http/request";
import { clearAuthCookies, setAuthCookies } from "@/server/auth/cookies";
import { rotateSession } from "@/server/auth/session";
import { REFRESH_COOKIE } from "@/server/auth/constants";

export async function POST(req: NextRequest) {
  try {
    const tokens = await rotateSession(req.cookies.get(REFRESH_COOKIE)?.value, {
      ip: clientIp(req),
      userAgent: userAgent(req),
    });
    const res = NextResponse.json({ success: true, data: { refreshed: !!tokens } });
    return tokens ? setAuthCookies(res, tokens) : res;
  } catch (e) {
    unstable_rethrow(e);
    return clearAuthCookies(toErrorResponse(e) as NextResponse);
  }
}
