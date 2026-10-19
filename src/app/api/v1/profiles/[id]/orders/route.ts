import { apiKeyAuthed } from "@/server/http/handler";
import { parseQuery } from "@/server/http/request";
import { ok, pageMeta } from "@/server/http/response";
import { notFound } from "@/server/http/errors";
import { paginationQuery } from "@/schemas/common";
import { getStoreForProfile } from "@/server/services/store.service";
import { listOrders } from "@/server/services/order.service";

export const GET = apiKeyAuthed<{ id: string }>(async (req, { auth, params }) => {
  const store = await getStoreForProfile(auth, params.id);
  if (!store) throw notFound("Store");
  const q = parseQuery(req, paginationQuery);
  const { items, total } = await listOrders(auth, store.id, q);
  return ok(items, { meta: pageMeta(q.page, q.pageSize, total) });
});
