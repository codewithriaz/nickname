import { authed } from "@/server/http/handler";
import { ok } from "@/server/http/response";
import { usernameSchema } from "@/schemas/profile";
import { isUsernameAvailable } from "@/server/services/profile.service";

export const GET = authed(async (req) => {
  const parsed = usernameSchema.safeParse(req.nextUrl.searchParams.get("username") ?? "");
  if (!parsed.success) return ok({ available: false, reason: parsed.error.issues[0]?.message ?? "Invalid" });
  const available = await isUsernameAvailable(parsed.data, req.nextUrl.searchParams.get("profileId") ?? undefined);
  return ok({ available, reason: available ? null : "Already taken" });
});
