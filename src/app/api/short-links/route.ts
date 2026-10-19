import { authed } from "@/server/http/handler";
import { parseBody, parseQuery } from "@/server/http/request";
import { created, ok, pageMeta } from "@/server/http/response";
import { paginationQuery } from "@/schemas/common";
import { shortLinkInputSchema } from "@/schemas/short-link";
import { createShortLink, listShortLinks } from "@/server/services/short-link.service";

export const GET = authed(async (req, { auth }) => {
  const q = parseQuery(req, paginationQuery);
  const { items, total } = await listShortLinks(auth, q);
  return ok(items, { meta: pageMeta(q.page, q.pageSize, total) });
});

export const POST = authed(async (req, { auth }) => created(await createShortLink(auth, await parseBody(req, shortLinkInputSchema))));
