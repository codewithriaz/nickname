import { z } from "zod";
import { adminOnly } from "@/server/http/handler";
import { parseQuery } from "@/server/http/request";
import { ok, pageMeta } from "@/server/http/response";
import { paginationQuery } from "@/schemas/common";
import { listUsers } from "@/server/services/admin.service";

const query = paginationQuery.extend({ role: z.string().optional(), status: z.string().optional() });

export const GET = adminOnly(async (req) => {
  const q = parseQuery(req, query);
  const { items, total } = await listUsers(q);
  return ok(items, { meta: pageMeta(q.page, q.pageSize, total) });
});
