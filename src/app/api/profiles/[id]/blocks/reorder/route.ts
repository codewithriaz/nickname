import { authed } from "@/server/http/handler";
import { parseBody } from "@/server/http/request";
import { ok } from "@/server/http/response";
import { reorderBlocksSchema } from "@/schemas/block";
import { reorderBlocks } from "@/server/services/block.service";

export const POST = authed<{ id: string }>(async (req, { auth, params }) => {
  const { items } = await parseBody(req, reorderBlocksSchema);
  return ok(await reorderBlocks(auth, params.id, items));
});
