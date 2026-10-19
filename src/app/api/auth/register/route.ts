import { NextResponse, type NextRequest } from "next/server";
import { handler } from "@/server/http/handler";
import { clientIp, parseBody, userAgent } from "@/server/http/request";
import { rateLimit } from "@/server/http/rate-limit";
import { registerSchema } from "@/schemas/auth";
import { register } from "@/server/services/auth.service";
import { setAuthCookies } from "@/server/auth/cookies";
import { getMe } from "@/server/services/user.service";

export const POST = handler(async (req: NextRequest) => {
  rateLimit(`register:${clientIp(req)}`, 10, 60 * 60 * 1000);
  const input = await parseBody(req, registerSchema);
  const referralCode = input.referralCode || req.cookies.get("nk_ref")?.value;
  const { user, tokens } = await register({ ...input, referralCode }, { ip: clientIp(req), userAgent: userAgent(req) });
  const res = NextResponse.json({ success: true, data: await getMe(user.id) }, { status: 201 });
  res.cookies.set("nk_ref", "", { path: "/", maxAge: 0 });
  return setAuthCookies(res, tokens);
});
