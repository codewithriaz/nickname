import { adminOnly } from "@/server/http/handler";
import { parseBody } from "@/server/http/request";
import { created, ok } from "@/server/http/response";
import { templateInputSchema } from "@/schemas/theme";
import { listTemplatesAdmin, upsertTemplate } from "@/server/services/admin.service";

export const GET = adminOnly(async () => ok(await listTemplatesAdmin()));
export const POST = adminOnly(async (req, { auth }) => created(await upsertTemplate(auth, null, await parseBody(req, templateInputSchema))));
