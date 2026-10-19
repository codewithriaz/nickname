import { adminOnly } from "@/server/http/handler";
import { parseBody } from "@/server/http/request";
import { ok } from "@/server/http/response";
import { planInputSchema } from "@/schemas/plan";
import { deletePlan, upsertPlan } from "@/server/services/admin.service";

type P = { id: string };

export const PUT = adminOnly<P>(async (req, { auth, params }) => ok(await upsertPlan(auth, params.id, await parseBody(req, planInputSchema))));
export const DELETE = adminOnly<P>(async (_req, { auth, params }) => ok(await deletePlan(auth, params.id)));
