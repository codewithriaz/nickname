import { z } from "zod";
import { PaymentStatus } from "@/generated/prisma/enums";
import { adminOnly } from "@/server/http/handler";
import { parseQuery } from "@/server/http/request";
import { ok, pageMeta } from "@/server/http/response";
import { paginationQuery } from "@/schemas/common";
import { listPayments } from "@/server/services/admin.service";

const query = paginationQuery.extend({ status: z.enum(PaymentStatus).optional(), gateway: z.string().optional() });

export const GET = adminOnly(async (req) => {
  const q = parseQuery(req, query);
  const { items, total } = await listPayments(q);
  return ok(items, { meta: pageMeta(q.page, q.pageSize, total) });
});
