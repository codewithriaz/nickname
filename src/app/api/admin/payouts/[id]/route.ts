import { adminOnly } from "@/server/http/handler";
import { parseBody } from "@/server/http/request";
import { ok } from "@/server/http/response";
import { adminPayoutSchema } from "@/schemas/admin";
import { processPayout } from "@/server/services/admin.service";

export const PATCH = adminOnly<{ id: string }>(async (req, { auth, params }) => {
  const { status, note } = await parseBody(req, adminPayoutSchema);
  return ok(await processPayout(auth, params.id, status, note));
});
