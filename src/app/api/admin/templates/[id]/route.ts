import { adminOnly } from "@/server/http/handler";
import { parseBody } from "@/server/http/request";
import { ok } from "@/server/http/response";
import { templateInputSchema } from "@/schemas/theme";
import { deleteTemplate, upsertTemplate } from "@/server/services/admin.service";

type P = { id: string };

export const PUT = adminOnly<P>(async (req, { auth, params }) => ok(await upsertTemplate(auth, params.id, await parseBody(req, templateInputSchema))));
export const DELETE = adminOnly<P>(async (_req, { auth, params }) => ok(await deleteTemplate(auth, params.id)));
