import "server-only";
import { db } from "../db";
import { referralCodeId, randomToken, sha256 } from "../crypto";
import { badRequest, conflict, forbidden, unauthorized } from "../http/errors";
import { hashPassword, verifyPassword } from "../auth/password";
import { createSession, revokeAllSessions } from "../auth/session";
import { emailLayout, sendMail } from "../mail";
import { getPlatformSettings } from "./settings.service";
import { absoluteUrl } from "@/config/site";
import type { ChangePasswordInput, ForgotPasswordInput, LoginInput, RegisterInput, ResetPasswordInput } from "@/schemas/auth";

type Meta = { userAgent?: string; ip?: string };

async function uniqueReferralCode() {
  for (let i = 0; i < 5; i++) {
    const code = referralCodeId();
    if (!(await db.user.findUnique({ where: { referralCode: code }, select: { id: true } }))) return code;
  }
  throw new Error("Could not generate referral code");
}

export async function register(input: RegisterInput, meta: Meta) {
  const settings = await getPlatformSettings();
  if (!settings.signupsEnabled) throw forbidden("New sign-ups are temporarily disabled");

  const exists = await db.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (exists) throw conflict("An account with this email already exists");

  const referrer = input.referralCode
    ? await db.user.findUnique({ where: { referralCode: input.referralCode.toUpperCase() }, select: { id: true } })
    : null;

  const user = await db.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash: await hashPassword(input.password),
      referralCode: await uniqueReferralCode(),
      referredById: referrer?.id ?? null,
      lastLoginAt: new Date(),
    },
  });
  const tokens = await createSession(user.id, meta);
  return { user, tokens };
}

export async function login(input: LoginInput, meta: Meta) {
  const user = await db.user.findUnique({ where: { email: input.email } });
  // Constant-ish time: always run bcrypt
  const valid = await verifyPassword(input.password, user?.passwordHash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva");
  if (!user || !valid) throw unauthorized("Invalid email or password");
  if (user.status !== "ACTIVE") throw forbidden("Your account is suspended. Contact support.");
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  const tokens = await createSession(user.id, meta);
  return { user, tokens };
}

export async function forgotPassword({ email }: ForgotPasswordInput) {
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return; // don't leak existence
  const token = randomToken(32);
  await db.passwordReset.create({
    data: { userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
  });
  const link = absoluteUrl(`/reset-password?token=${token}`);
  await sendMail(
    user.email,
    "Reset your password",
    emailLayout("Reset your password", `<p>Click the link below to set a new password (valid for 1 hour):</p><p><a href="${link}">${link}</a></p>`),
  );
}

export async function resetPassword({ token, password }: ResetPasswordInput) {
  const reset = await db.passwordReset.findUnique({ where: { tokenHash: sha256(token) } });
  if (!reset || reset.usedAt || reset.expiresAt < new Date()) throw badRequest("Reset link is invalid or expired");
  await db.$transaction([
    db.user.update({ where: { id: reset.userId }, data: { passwordHash: await hashPassword(password) } }),
    db.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
  ]);
  await revokeAllSessions(reset.userId);
}

export async function changePassword(userId: string, sessionId: string, input: ChangePasswordInput) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (!(await verifyPassword(input.currentPassword, user.passwordHash))) throw badRequest("Current password is incorrect");
  await db.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(input.newPassword) } });
  await revokeAllSessions(userId, sessionId);
}
