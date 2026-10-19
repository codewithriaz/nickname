import { z } from "zod";
import { VerificationStatus } from "@/generated/prisma/enums";
import { adminOnly } from "@/server/http/handler";
import { parseBody } from "@/server/http/request";
import { ok } from "@/server/http/response";
import { updateProfileAdmin } from "@/server/services/admin.service";

const schema = z.object({ verification: z.enum(VerificationStatus).optional(), isPublished: z.boolean().optional() });

export const PATCH = adminOnly<{ id: string }>(async (req, { auth, params }) =>
  ok(await updateProfileAdmin(auth, params.id, await parseBody(req, schema))),
);
