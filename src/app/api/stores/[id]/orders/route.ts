import { z } from "zod";
import { OrderStatus } from "@/generated/prisma/enums";
import { authed } from "@/server/http/handler";
import { parseQuery } from "@/server/http/request";
import { ok, pageMeta } from "@/server/http/response";
import { paginationQuery } from "@/schemas/common";
import { listOrders } from "@/server/services/order.service";

const query = paginationQuery.extend({ status: z.enum(OrderStatus).optional() });

export const GET = authed<{ id: string }>(async (req, { auth, params }) => {
  const q = parseQuery(req, query);
  const { items, total, statusCounts } = await listOrders(auth, params.id, q);
  return ok({ items, statusCounts }, { meta: pageMeta(q.page, q.pageSize, total) });
});
