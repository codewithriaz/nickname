import { z } from "zod";
import { authed } from "@/server/http/handler";
import { parseBody } from "@/server/http/request";
import { created, ok } from "@/server/http/response";
import { createApiKey, listApiKeys } from "@/server/services/api-key.service";

export const GET = authed(async (_req, { auth }) => ok(await listApiKeys(auth.userId)));

export const POST = authed(async (req, { auth }) => {
  const { name } = await parseBody(req, z.object({ name: z.string().trim().min(1).max(60) }));
  return created(await createApiKey(auth.userId, name));
});
