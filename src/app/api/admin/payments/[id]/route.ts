import { z } from "zod";
import { adminOnly } from "@/server/http/handler";
import { parseBody } from "@/server/http/request";
import { ok } from "@/server/http/response";
import { reviewPayment } from "@/server/services/admin.service";

export const POST = adminOnly<{ id: string }>(async (req, { auth, params }) => {
  const { action } = await parseBody(req, z.object({ action: z.enum(["approve", "reject", "refund"]) }));
  return ok(await reviewPayment(auth, params.id, action));
});
