import { after, type NextRequest } from "next/server";
import { resolveShortLink } from "@/server/services/short-link.service";
import { recordEvent } from "@/server/analytics/track";
import { absoluteUrl } from "@/config/site";

/** Short link redirect (request-time). `?qr=1` marks QR scans. */
export async function GET(req: NextRequest, ctx: RouteContext<"/s/[code]">) {
  const { code } = await ctx.params;
  const link = await resolveShortLink(code);
  if (link.status === "password") return Response.redirect(absoluteUrl(`/s/${encodeURIComponent(code)}/unlock`), 302);
  if (link.status !== "ok") return Response.redirect(absoluteUrl(`/link-unavailable?reason=${link.status}`), 302);

  const isQr = req.nextUrl.searchParams.get("qr") === "1";
  const headers = new Headers(req.headers);
  const url = req.url;
  after(() => recordEvent(new Request(url, { headers }), { type: isQr ? "QR_SCAN" : "SHORTLINK_CLICK", shortLinkId: link.id }));
  return new Response(null, { status: 302, headers: { Location: link.destination, "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}
