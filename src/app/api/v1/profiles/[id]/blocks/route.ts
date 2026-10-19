import { apiKeyAuthed } from "@/server/http/handler";
import { parseBody } from "@/server/http/request";
import { created, ok } from "@/server/http/response";
import { createBlockSchema } from "@/schemas/block";
import { createBlock, listBlocks } from "@/server/services/block.service";

type P = { id: string };

export const GET = apiKeyAuthed<P>(async (_req, { auth, params }) => ok(await listBlocks(auth, params.id)));
export const POST = apiKeyAuthed<P>(async (req, { auth, params }) => created(await createBlock(auth, params.id, await parseBody(req, createBlockSchema))));
