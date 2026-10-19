import { z } from "zod";
import { authed } from "@/server/http/handler";
import { parseBody } from "@/server/http/request";
import { ok } from "@/server/http/response";
import { cancelSubscription } from "@/server/services/billing.service";

export const POST = authed(async (req, { auth }) => {
  const { cancel } = await parseBody(req, z.object({ cancel: z.boolean() }));
  return ok(await cancelSubscription(auth, cancel));
});
