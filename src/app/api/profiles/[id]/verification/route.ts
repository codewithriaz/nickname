import { authed } from "@/server/http/handler";
import { ok } from "@/server/http/response";
import { requestVerification } from "@/server/services/profile.service";

export const POST = authed<{ id: string }>(async (_req, { auth, params }) => ok(await requestVerification(auth, params.id)));
