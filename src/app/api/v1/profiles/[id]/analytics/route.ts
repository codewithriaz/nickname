import { apiKeyAuthed } from "@/server/http/handler";
import { parseQuery } from "@/server/http/request";
import { ok } from "@/server/http/response";
import { dateRangeQuery } from "@/schemas/common";
import { getProfileAnalytics } from "@/server/services/analytics.service";

export const GET = apiKeyAuthed<{ id: string }>(async (req, { auth, params }) =>
  ok(await getProfileAnalytics(auth, params.id, parseQuery(req, dateRangeQuery), req.nextUrl.searchParams.get("tz"))),
);
