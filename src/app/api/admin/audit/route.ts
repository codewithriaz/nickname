import { adminOnly } from "@/server/http/handler";
import { parseQuery } from "@/server/http/request";
import { ok, pageMeta } from "@/server/http/response";
import { paginationQuery } from "@/schemas/common";
import { listAuditLogs } from "@/server/services/admin.service";

export const GET = adminOnly(async (req) => {
  const q = parseQuery(req, paginationQuery);
  const { items, total } = await listAuditLogs(q);
  return ok(items, { meta: pageMeta(q.page, q.pageSize, total) });
});
