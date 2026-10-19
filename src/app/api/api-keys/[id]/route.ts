import { authed } from "@/server/http/handler";
import { ok } from "@/server/http/response";
import { revokeApiKey } from "@/server/services/api-key.service";

export const DELETE = authed<{ id: string }>(async (_req, { auth, params }) => ok(await revokeApiKey(auth.userId, params.id)));
