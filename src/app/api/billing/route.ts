import { authed } from "@/server/http/handler";
import { ok } from "@/server/http/response";
import { getBillingOverview } from "@/server/services/billing.service";

export const GET = authed(async (_req, { auth }) => ok(await getBillingOverview(auth.userId)));
