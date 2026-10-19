import { adminOnly } from "@/server/http/handler";
import { parseBody } from "@/server/http/request";
import { ok } from "@/server/http/response";
import { couponInputSchema } from "@/schemas/billing";
import { deleteCoupon, upsertCoupon } from "@/server/services/admin.service";

type P = { id: string };

export const PUT = adminOnly<P>(async (req, { auth, params }) => ok(await upsertCoupon(auth, params.id, await parseBody(req, couponInputSchema))));
export const DELETE = adminOnly<P>(async (_req, { auth, params }) => ok(await deleteCoupon(auth, params.id)));
