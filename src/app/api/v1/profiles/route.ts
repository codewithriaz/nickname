import { apiKeyAuthed } from "@/server/http/handler";
import { ok } from "@/server/http/response";
import { listProfiles } from "@/server/services/profile.service";

export const GET = apiKeyAuthed(async (_req, { auth }) => ok(await listProfiles(auth.userId)));
