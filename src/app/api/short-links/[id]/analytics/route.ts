import { authed } from "@/server/http/handler";
import { parseQuery } from "@/server/http/request";
import { ok } from "@/server/http/response";
import { dateRangeQuery } from "@/schemas/common";
import { getShortLinkAnalytics } from "@/server/services/analytics.service";

export const GET = authed<{ id: string }>(async (req, { auth, params }) =>
  ok(await getShortLinkAnalytics(auth, params.id, parseQuery(req, dateRangeQuery), req.headers.get("x-client-tz"))),
);
