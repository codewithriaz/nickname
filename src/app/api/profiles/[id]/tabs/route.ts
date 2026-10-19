import { authed } from "@/server/http/handler";
import { parseBody } from "@/server/http/request";
import { created, ok } from "@/server/http/response";
import { tabInputSchema } from "@/schemas/block";
import { createTab, listTabs } from "@/server/services/tab.service";

type P = { id: string };

export const GET = authed<P>(async (_req, { auth, params }) => ok(await listTabs(auth, params.id)));

export const POST = authed<P>(async (req, { auth, params }) => {
  const { title } = await parseBody(req, tabInputSchema);
  return created(await createTab(auth, params.id, title));
});
