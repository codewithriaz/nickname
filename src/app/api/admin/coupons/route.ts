import { adminOnly } from "@/server/http/handler";
import { parseBody } from "@/server/http/request";
import { created, ok } from "@/server/http/response";
import { couponInputSchema } from "@/schemas/billing";
import { listCoupons, upsertCoupon } from "@/server/services/admin.service";

export const GET = adminOnly(async () => ok(await listCoupons()));
export const POST = adminOnly(async (req, { auth }) => created(await upsertCoupon(auth, null, await parseBody(req, couponInputSchema))));
