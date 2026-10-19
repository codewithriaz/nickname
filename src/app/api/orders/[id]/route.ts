import { authed } from "@/server/http/handler";
import { parseBody } from "@/server/http/request";
import { ok } from "@/server/http/response";
import { updateOrderSchema } from "@/schemas/shop";
import { getOrder, updateOrder } from "@/server/services/order.service";

type P = { id: string };

export const GET = authed<P>(async (_req, { auth, params }) => ok(await getOrder(auth, params.id)));

export const PATCH = authed<P>(async (req, { auth, params }) => ok(await updateOrder(auth, params.id, await parseBody(req, updateOrderSchema))));
