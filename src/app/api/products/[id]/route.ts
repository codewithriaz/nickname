import { authed } from "@/server/http/handler";
import { parseBody } from "@/server/http/request";
import { ok } from "@/server/http/response";
import { productInputSchema } from "@/schemas/shop";
import { deleteProduct, updateProduct } from "@/server/services/store.service";

type P = { id: string };

export const PUT = authed<P>(async (req, { auth, params }) => ok(await updateProduct(auth, params.id, await parseBody(req, productInputSchema))));

export const DELETE = authed<P>(async (_req, { auth, params }) => ok(await deleteProduct(auth, params.id)));
