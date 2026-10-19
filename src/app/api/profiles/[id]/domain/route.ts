import { authed } from "@/server/http/handler";
import { parseBody } from "@/server/http/request";
import { ok } from "@/server/http/response";
import { customDomainSchema } from "@/schemas/profile";
import { setCustomDomain, verifyCustomDomain } from "@/server/services/profile.service";

type P = { id: string };

export const PUT = authed<P>(async (req, { auth, params }) => {
  const { domain } = await parseBody(req, customDomainSchema);
  return ok(await setCustomDomain(auth, params.id, domain));
});

export const POST = authed<P>(async (_req, { auth, params }) => ok(await verifyCustomDomain(auth, params.id)));
