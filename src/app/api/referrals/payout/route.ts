import { authed } from "@/server/http/handler";
import { parseBody } from "@/server/http/request";
import { created } from "@/server/http/response";
import { payoutRequestSchema } from "@/schemas/billing";
import { requestPayout } from "@/server/services/referral.service";

export const POST = authed(async (req, { auth }) => created(await requestPayout(auth.userId, await parseBody(req, payoutRequestSchema))));
