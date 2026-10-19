import { authed } from "@/server/http/handler";
import { parseBody } from "@/server/http/request";
import { created, ok } from "@/server/http/response";
import { categoryInputSchema } from "@/schemas/shop";
import { createCategory, listCategories } from "@/server/services/store.service";

type P = { id: string };

export const GET = authed<P>(async (_req, { auth, params }) => ok(await listCategories(auth, params.id)));

export const POST = authed<P>(async (req, { auth, params }) => {
  const { name, imageUrl } = await parseBody(req, categoryInputSchema);
  return created(await createCategory(auth, params.id, name, imageUrl));
});
