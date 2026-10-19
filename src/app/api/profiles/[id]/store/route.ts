import { authed } from "@/server/http/handler";
import { parseBody } from "@/server/http/request";
import { ok } from "@/server/http/response";
import { storeInputSchema } from "@/schemas/shop";
import { getStoreForProfile, upsertStore } from "@/server/services/store.service";

type P = { id: string };

export const GET = authed<P>(async (_req, { auth, params }) => ok(await getStoreForProfile(auth, params.id)));

export const PUT = authed<P>(async (req, { auth, params }) => ok(await upsertStore(auth, params.id, await parseBody(req, storeInputSchema))));
