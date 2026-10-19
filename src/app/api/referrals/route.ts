import { authed } from "@/server/http/handler";
import { ok } from "@/server/http/response";
import { getReferralSummary } from "@/server/services/referral.service";

export const GET = authed(async (_req, { auth }) => ok(await getReferralSummary(auth.userId)));
