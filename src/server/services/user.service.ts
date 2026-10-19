import "server-only";
import { db } from "../db";
import { notFound } from "../http/errors";
import { getUserPlan } from "./plan.service";
import { toPlanDTO, toSubscriptionDTO } from "./mappers";
import type { MeDTO } from "@/types/dto";

export async function getMe(userId: string, impersonating = false): Promise<MeDTO> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw notFound("User");
  const resolved = await getUserPlan(userId);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    role: user.role,
    emailVerified: user.emailVerified,
    referralCode: user.referralCode,
    createdAt: user.createdAt.toISOString(),
    impersonating,
    plan: toPlanDTO(resolved.plan),
    isPaid: resolved.isPaid,
    subscription: resolved.subscription ? toSubscriptionDTO(resolved.subscription) : null,
  };
}
