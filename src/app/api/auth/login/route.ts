import { NextResponse, type NextRequest } from "next/server";
import { handler } from "@/server/http/handler";
import { clientIp, parseBody, userAgent } from "@/server/http/request";
import { rateLimit } from "@/server/http/rate-limit";
import { loginSchema } from "@/schemas/auth";
import { login } from "@/server/services/auth.service";
import { setAuthCookies } from "@/server/auth/cookies";
import { getMe } from "@/server/services/user.service";

export const POST = handler(async (req: NextRequest) => {
  const input = await parseBody(req, loginSchema);
  rateLimit(`login:${clientIp(req)}:${input.email}`, 10, 15 * 60 * 1000);
  const { user, tokens } = await login(input, { ip: clientIp(req), userAgent: userAgent(req) });
  const res = NextResponse.json({ success: true, data: await getMe(user.id) });
  return setAuthCookies(res, tokens);
});
