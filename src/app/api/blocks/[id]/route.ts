import { authed } from "@/server/http/handler";
import { parseBody } from "@/server/http/request";
import { ok } from "@/server/http/response";
import { updateBlockSchema } from "@/schemas/block";
import { deleteBlock, updateBlock } from "@/server/services/block.service";

type P = { id: string };

export const PATCH = authed<P>(async (req, { auth, params }) => ok(await updateBlock(auth, params.id, await parseBody(req, updateBlockSchema))));

export const DELETE = authed<P>(async (_req, { auth, params }) => ok(await deleteBlock(auth, params.id)));
