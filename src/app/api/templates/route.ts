import { authed } from "@/server/http/handler";
import { ok } from "@/server/http/response";
import { db } from "@/server/db";
import { toTemplateDTO } from "@/server/services/mappers";

export const GET = authed(async () => {
  const rows = await db.template.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  return ok(rows.map(toTemplateDTO));
});
