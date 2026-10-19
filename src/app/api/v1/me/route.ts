import { apiKeyAuthed } from "@/server/http/handler";
import { ok } from "@/server/http/response";
import { getMe } from "@/server/services/user.service";

export const GET = apiKeyAuthed(async (_req, { auth }) => {
  const me = await getMe(auth.userId);
  return ok({ id: me.id, email: me.email, name: me.name, plan: me.plan.slug });
});
