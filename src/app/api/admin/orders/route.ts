import { z } from "zod";
import { OrderStatus } from "@/generated/prisma/enums";
import { adminOnly } from "@/server/http/handler";
import { parseQuery } from "@/server/http/request";
import { ok, pageMeta } from "@/server/http/response";
import { paginationQuery } from "@/schemas/common";
import { listOrdersAdmin } from "@/server/services/admin.service";

const query = paginationQuery.extend({ status: z.enum(OrderStatus).optional() });

export const GET = adminOnly(async (req) => {
  const q = parseQuery(req, query);
  const { items, total } = await listOrdersAdmin(q);
  return ok(items, { meta: pageMeta(q.page, q.pageSize, total) });
});
