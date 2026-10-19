import { handler } from "@/server/http/handler";
import { notFound } from "@/server/http/errors";
import { ok } from "@/server/http/response";
import { getUsernameByDomain } from "@/server/queries/public";

/** Custom-domain lookup used by src/proxy.ts (verified domains only, cached). */
export const GET = handler<{ host: string }>(async (_req, { params }) => {
  const username = await getUsernameByDomain(decodeURIComponent(params.host).toLowerCase());
  if (!username) throw notFound("Domain");
  return ok({ username });
});
