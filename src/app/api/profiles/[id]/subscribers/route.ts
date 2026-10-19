import { authed } from "@/server/http/handler";
import { parseQuery } from "@/server/http/request";
import { ok, pageMeta } from "@/server/http/response";
import { paginationQuery } from "@/schemas/common";
import { listSubscribers } from "@/server/services/subscriber.service";

export const GET = authed<{ id: string }>(async (req, { auth, params }) => {
  const q = parseQuery(req, paginationQuery);
  const { items, total } = await listSubscribers(auth, params.id, q);
  return ok(items, { meta: pageMeta(q.page, q.pageSize, total) });
});
