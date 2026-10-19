import { handler } from "@/server/http/handler";
import { ok } from "@/server/http/response";
import { listActivePlans } from "@/server/services/billing.service";

export const GET = handler(async () => ok(await listActivePlans()));
