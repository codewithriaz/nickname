import { authed } from "@/server/http/handler";
import { parseBody } from "@/server/http/request";
import { created, ok } from "@/server/http/response";
import { createProfileSchema } from "@/schemas/profile";
import { createProfile, listProfiles } from "@/server/services/profile.service";

export const GET = authed(async (_req, { auth }) => ok(await listProfiles(auth.userId)));

export const POST = authed(async (req, { auth }) => created(await createProfile(auth.userId, await parseBody(req, createProfileSchema))));
