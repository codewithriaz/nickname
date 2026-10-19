import { authed } from "@/server/http/handler";
import { parseBody } from "@/server/http/request";
import { ok } from "@/server/http/response";
import { categoryUpdateSchema } from "@/schemas/shop";
import { deleteCategory, updateCategory } from "@/server/services/store.service";

export const PATCH = authed<{ id: string }>(async (req, { auth, params }) =>
  ok(await updateCategory(auth, params.id, await parseBody(req, categoryUpdateSchema))),
);

export const DELETE = authed<{ id: string }>(async (_req, { auth, params }) => ok(await deleteCategory(auth, params.id)));
