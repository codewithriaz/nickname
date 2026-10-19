import { adminOnly } from "@/server/http/handler";
import { parseBody } from "@/server/http/request";
import { ok } from "@/server/http/response";
import { adminUpdateUserSchema } from "@/schemas/admin";
import { deleteUser, getUserDetail, updateUser } from "@/server/services/admin.service";

type P = { id: string };

export const GET = adminOnly<P>(async (_req, { params }) => ok(await getUserDetail(params.id)));
export const PATCH = adminOnly<P>(async (req, { auth, params }) => ok(await updateUser(auth, params.id, await parseBody(req, adminUpdateUserSchema))));
export const DELETE = adminOnly<P>(async (_req, { auth, params }) => ok(await deleteUser(auth, params.id)));
