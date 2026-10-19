import { adminOnly } from "@/server/http/handler";
import { parseBody } from "@/server/http/request";
import { ok } from "@/server/http/response";
import { adminAssignPlanSchema } from "@/schemas/admin";
import { assignPlan } from "@/server/services/admin.service";

export const POST = adminOnly<{ id: string }>(async (req, { auth, params }) =>
  ok(await assignPlan(auth, params.id, await parseBody(req, adminAssignPlanSchema))),
);
