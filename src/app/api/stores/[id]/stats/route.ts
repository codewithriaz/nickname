import { authed } from "@/server/http/handler";
import { ok } from "@/server/http/response";
import { getOwnedStore } from "@/server/services/store.service";
import { storeOrderStats } from "@/server/services/order.service";

export const GET = authed<{ id: string }>(async (_req, { auth, params }) => {
  await getOwnedStore(auth, params.id);
  return ok(await storeOrderStats(params.id));
});
