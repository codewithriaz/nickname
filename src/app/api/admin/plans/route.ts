import { adminOnly } from "@/server/http/handler";
import { parseBody } from "@/server/http/request";
import { created, ok } from "@/server/http/response";
import { planInputSchema } from "@/schemas/plan";
import { listPlansAdmin, upsertPlan } from "@/server/services/admin.service";

export const GET = adminOnly(async () => ok(await listPlansAdmin()));
export const POST = adminOnly(async (req, { auth }) => created(await upsertPlan(auth, null, await parseBody(req, planInputSchema))));
