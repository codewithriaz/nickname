import { authed } from "@/server/http/handler";
import { parseBody } from "@/server/http/request";
import { ok } from "@/server/http/response";
import { tabInputSchema } from "@/schemas/block";
import { deleteTab, updateTab } from "@/server/services/tab.service";

type P = { id: string };

export const PATCH = authed<P>(async (req, { auth, params }) => {
  const { title } = await parseBody(req, tabInputSchema);
  return ok(await updateTab(auth, params.id, title));
});

export const DELETE = authed<P>(async (_req, { auth, params }) => ok(await deleteTab(auth, params.id)));
