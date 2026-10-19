import { authed } from "@/server/http/handler";
import { parseBody } from "@/server/http/request";
import { ok } from "@/server/http/response";
import { updateProfileSchema } from "@/schemas/profile";
import { deleteProfile, getOwnedProfile, updateProfile } from "@/server/services/profile.service";
import { toProfileDTO } from "@/server/services/mappers";

type P = { id: string };

export const GET = authed<P>(async (_req, { auth, params }) => ok(toProfileDTO(await getOwnedProfile(auth, params.id))));

export const PATCH = authed<P>(async (req, { auth, params }) =>
  ok(await updateProfile(auth, params.id, await parseBody(req, updateProfileSchema))),
);

export const DELETE = authed<P>(async (_req, { auth, params }) => ok(await deleteProfile(auth, params.id)));
