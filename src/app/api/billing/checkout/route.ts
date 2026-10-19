import { authed } from "@/server/http/handler";
import { parseBody } from "@/server/http/request";
import { ok } from "@/server/http/response";
import { billingCheckoutSchema } from "@/schemas/billing";
import { startCheckout } from "@/server/services/billing.service";

export const POST = authed(async (req, { auth }) => ok(await startCheckout(auth, await parseBody(req, billingCheckoutSchema))));
