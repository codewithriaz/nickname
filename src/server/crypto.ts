import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { customAlphabet } from "nanoid";
import { env } from "./env";

export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
export const randomToken = (bytes = 32) => randomBytes(bytes).toString("base64url");

const alphabet = "0123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
export const shortId = customAlphabet(alphabet, 7);
export const referralCodeId = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);
export const transactionId = (prefix: string) =>
  `${prefix}${Date.now().toString(36).toUpperCase()}${customAlphabet("0123456789ABCDEFGHJKLMNPQRSTUVWXYZ", 6)()}`;

export function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** AES-256-GCM encryption for secrets at rest. Output: iv.tag.ciphertext (base64url). */
export function encrypt(plain: string) {
  const key = Buffer.from(env().ENCRYPTION_KEY, "hex");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), enc].map((b) => b.toString("base64url")).join(".");
}

export function decrypt(payload: string) {
  const [iv, tag, enc] = payload.split(".").map((p) => Buffer.from(p, "base64url"));
  const key = Buffer.from(env().ENCRYPTION_KEY, "hex");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

export const encryptJson = (value: unknown) => encrypt(JSON.stringify(value));
export function decryptJson<T>(payload: string | null | undefined): T | null {
  if (!payload) return null;
  try {
    return JSON.parse(decrypt(payload)) as T;
  } catch {
    return null;
  }
}
