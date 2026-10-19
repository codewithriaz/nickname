import { authed } from "@/server/http/handler";
import { created } from "@/server/http/response";
import { duplicateBlock } from "@/server/services/block.service";

export const POST = authed<{ id: string }>(async (_req, { auth, params }) => created(await duplicateBlock(auth, params.id)));
