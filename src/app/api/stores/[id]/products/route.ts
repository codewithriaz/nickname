import { authed } from "@/server/http/handler";
import { parseBody } from "@/server/http/request";
import { created, ok } from "@/server/http/response";
import { productInputSchema } from "@/schemas/shop";
import { createProduct, listProducts } from "@/server/services/store.service";

type P = { id: string };

export const GET = authed<P>(async (req, { auth, params }) =>
  ok(await listProducts(auth, params.id, req.nextUrl.searchParams.get("search") ?? undefined)),
);

export const POST = authed<P>(async (req, { auth, params }) => created(await createProduct(auth, params.id, await parseBody(req, productInputSchema))));
