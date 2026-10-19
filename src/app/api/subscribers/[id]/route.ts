import { authed } from "@/server/http/handler";
import { ok } from "@/server/http/response";
import { deleteSubscriber } from "@/server/services/subscriber.service";

export const DELETE = authed<{ id: string }>(async (_req, { auth, params }) => ok(await deleteSubscriber(auth, params.id)));
