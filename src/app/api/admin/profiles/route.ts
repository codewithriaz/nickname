import { z } from "zod";
import { VerificationStatus } from "@/generated/prisma/enums";
import { adminOnly } from "@/server/http/handler";
import { parseQuery } from "@/server/http/request";
import { ok, pageMeta } from "@/server/http/response";
import { paginationQuery } from "@/schemas/common";
import { listProfilesAdmin } from "@/server/services/admin.service";

const query = paginationQuery.extend({ verification: z.enum(VerificationStatus).optional() });

export const GET = adminOnly(async (req) => {
  const q = parseQuery(req, query);
  const { items, total } = await listProfilesAdmin(q);
  return ok(items, { meta: pageMeta(q.page, q.pageSize, total) });
});
