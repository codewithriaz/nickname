import { adminOnly } from "@/server/http/handler";
import { ok } from "@/server/http/response";
import { getAdminStats } from "@/server/services/admin.service";

export const GET = adminOnly(async () => ok(await getAdminStats()));
