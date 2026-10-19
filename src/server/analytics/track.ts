import "server-only";
import { UAParser } from "ua-parser-js";
import type { EventType } from "@/generated/prisma/enums";
import { db } from "../db";
import { sha256 } from "../crypto";
import { clientIp } from "../http/request";
import { hostnameOf } from "@/lib/utils";

const BOT_RE = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegrambot|headless|lighthouse|pingdom|curl|wget/i;

export type TrackInput = {
  type: EventType;
  profileId?: string | null;
  blockId?: string | null;
  shortLinkId?: string | null;
  productId?: string | null;
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
};

export function requestFingerprint(req: Request) {
  const ua = req.headers.get("user-agent") ?? "";
  const ip = clientIp(req);
  const day = new Date().toISOString().slice(0, 10);
  const parsed = UAParser(ua);
  return {
    isBot: !ua || BOT_RE.test(ua),
    visitorId: sha256(`${ip}|${ua}|${day}|${process.env.JWT_ACCESS_SECRET ?? ""}`).slice(0, 32),
    device: parsed.device.type === "mobile" ? "Mobile" : parsed.device.type === "tablet" ? "Tablet" : "Desktop",
    browser: parsed.browser.name ?? "Other",
    os: parsed.os.name ?? "Other",
    country:
      req.headers.get("x-vercel-ip-country") ?? req.headers.get("cf-ipcountry") ?? req.headers.get("x-country-code") ?? null,
    city: decodeURIComponent(req.headers.get("x-vercel-ip-city") ?? "") || null,
  };
}

/** Records an analytics event. Never throws (analytics must not break user flows). */
export async function recordEvent(req: Request, input: TrackInput) {
  try {
    const fp = requestFingerprint(req);
    if (fp.isBot) return;
    const referrerHost = hostnameOf(input.referrer ?? req.headers.get("referer"));
    const ownHost = hostnameOf(process.env.NEXT_PUBLIC_APP_URL);
    await db.analyticsEvent.create({
      data: {
        type: input.type,
        profileId: input.profileId ?? null,
        blockId: input.blockId ?? null,
        shortLinkId: input.shortLinkId ?? null,
        productId: input.productId ?? null,
        visitorId: fp.visitorId,
        referrer: referrerHost && referrerHost !== ownHost ? referrerHost : referrerHost === ownHost ? null : "Direct",
        country: fp.country,
        city: fp.city,
        device: fp.device,
        browser: fp.browser,
        os: fp.os,
        utmSource: input.utmSource?.slice(0, 80) ?? null,
        utmMedium: input.utmMedium?.slice(0, 80) ?? null,
        utmCampaign: input.utmCampaign?.slice(0, 120) ?? null,
      },
    });
    if (input.type === "LINK_CLICK" && input.blockId) {
      await db.block.updateMany({ where: { id: input.blockId }, data: { clicks: { increment: 1 } } });
    }
    if ((input.type === "SHORTLINK_CLICK" || input.type === "QR_SCAN") && input.shortLinkId) {
      await db.shortLink.update({ where: { id: input.shortLinkId }, data: { clicks: { increment: 1 } } });
    }
  } catch (e) {
    console.error("[analytics] failed to record", e);
  }
}
