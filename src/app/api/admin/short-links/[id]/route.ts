import { z } from "zod";
import { adminOnly } from "@/server/http/handler";
import { parseBody } from "@/server/http/request";
import { ok } from "@/server/http/response";
import { toggleShortLinkAdmin } from "@/server/services/admin.service";

export const PATCH = adminOnly<{ id: string }>(async (req, { auth, params }) => {
  const { isActive } = await parseBody(req, z.object({ isActive: z.boolean() }));
  return ok(await toggleShortLinkAdmin(auth, params.id, isActive));
});
