import { z } from "zod";
import { authed } from "@/server/http/handler";
import { parseBody } from "@/server/http/request";
import { ok } from "@/server/http/response";
import { startTrial } from "@/server/services/billing.service";

export const POST = authed(async (req, { auth }) => {
  const { planId } = await parseBody(req, z.object({ planId: z.string() }));
  return ok(await startTrial(auth, planId));
});
