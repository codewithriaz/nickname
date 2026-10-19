import { authed } from "@/server/http/handler";
import { parseBody } from "@/server/http/request";
import { ok } from "@/server/http/response";
import { updateShortLinkSchema } from "@/schemas/short-link";
import { deleteShortLink, updateShortLink } from "@/server/services/short-link.service";

type P = { id: string };

export const PATCH = authed<P>(async (req, { auth, params }) => ok(await updateShortLink(auth, params.id, await parseBody(req, updateShortLinkSchema))));

export const DELETE = authed<P>(async (_req, { auth, params }) => ok(await deleteShortLink(auth, params.id)));
