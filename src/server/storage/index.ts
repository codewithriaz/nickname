import "server-only";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { customAlphabet } from "nanoid";
import { put } from "@vercel/blob";
import { AwsClient } from "aws4fetch";
import { env } from "../env";
import { badRequest } from "../http/errors";

/**
 * Upload storage with three drivers (picked by STORAGE_DRIVER or auto-detected):
 *  - vercel-blob → BLOB_READ_WRITE_TOKEN set (Vercel Blob, public URLs)
 *  - s3          → S3_BUCKET set (Cloudflare R2, AWS S3, DO Spaces, Backblaze B2 … any S3-compatible API)
 *  - local       → disk (UPLOAD_DIR), served by /api/files/[...path] — dev / VPS only (not serverless)
 */
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "application/pdf": "pdf",
  "application/zip": "zip",
  "audio/mpeg": "mp3",
};

/** Verify the file's real signature matches its declared type (prevents spoofed uploads). */
function matchesSignature(type: string, b: Buffer) {
  const hex = b.subarray(0, 12).toString("hex");
  switch (type) {
    case "image/jpeg":
      return hex.startsWith("ffd8ff");
    case "image/png":
      return hex.startsWith("89504e47");
    case "image/gif":
      return hex.startsWith("47494638");
    case "image/webp":
      return hex.startsWith("52494646") && b.subarray(8, 12).toString("ascii") === "WEBP";
    case "image/avif":
      return b.subarray(4, 12).toString("ascii").startsWith("ftyp");
    case "application/pdf":
      return hex.startsWith("25504446");
    case "application/zip":
      return hex.startsWith("504b0304");
    default:
      return true;
  }
}

const fileId = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 16);

export type StorageDriver = "local" | "vercel-blob" | "s3";

export function storageDriver(): StorageDriver {
  const e = env();
  if (e.STORAGE_DRIVER) return e.STORAGE_DRIVER;
  if (e.BLOB_READ_WRITE_TOKEN) return "vercel-blob";
  if (e.S3_BUCKET) return "s3";
  return "local";
}

// ── Drivers ────────────────────────────────────────────────────────────

const root = () => path.resolve(/* turbopackIgnore: true */ process.cwd(), env().UPLOAD_DIR);

async function putLocal(key: string, buffer: Buffer) {
  const abs = path.join(/* turbopackIgnore: true */ root(), key);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, buffer);
  return `/api/files/${key}`;
}

async function putVercelBlob(key: string, buffer: Buffer, contentType: string) {
  const blob = await put(key, buffer, {
    access: "public",
    contentType,
    addRandomSuffix: false,
    token: env().BLOB_READ_WRITE_TOKEN,
    cacheControlMaxAge: 60 * 60 * 24 * 365,
  });
  return blob.url;
}

let s3: AwsClient | null = null;
async function putS3(key: string, buffer: Buffer, contentType: string) {
  const e = env();
  if (!e.S3_ENDPOINT || !e.S3_BUCKET || !e.S3_ACCESS_KEY_ID || !e.S3_SECRET_ACCESS_KEY || !e.S3_PUBLIC_URL) {
    throw new Error("S3 storage needs S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY and S3_PUBLIC_URL");
  }
  s3 ??= new AwsClient({ accessKeyId: e.S3_ACCESS_KEY_ID, secretAccessKey: e.S3_SECRET_ACCESS_KEY, region: e.S3_REGION, service: "s3" });
  const url = `${e.S3_ENDPOINT.replace(/\/$/, "")}/${e.S3_BUCKET}/${key}`;
  const res = await s3.fetch(url, {
    method: "PUT",
    body: new Uint8Array(buffer),
    headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=31536000, immutable" },
  });
  if (!res.ok) throw new Error(`S3 upload failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  return `${e.S3_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
}

// ── Public API ─────────────────────────────────────────────────────────

export async function saveUpload(file: File, folder: "images" | "files", ownerId: string) {
  const ext = ALLOWED[file.type];
  if (!ext) throw badRequest("Unsupported file type");
  if (folder === "images" && !file.type.startsWith("image/")) throw badRequest("Only images allowed");
  const maxBytes = env().MAX_UPLOAD_MB * 1024 * 1024 * (folder === "files" ? 4 : 1);
  if (file.size > maxBytes) throw badRequest(`File too large (max ${Math.round(maxBytes / 1048576)}MB)`);

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!matchesSignature(file.type, buffer)) throw badRequest("File content doesn't match its type");

  const safeOwner = ownerId.replace(/[^a-zA-Z0-9]/g, "");
  const key = path.posix.join(folder, safeOwner, `${fileId()}.${ext}`);
  const driver = storageDriver();
  const url =
    driver === "vercel-blob" ? await putVercelBlob(key, buffer, file.type) : driver === "s3" ? await putS3(key, buffer, file.type) : await putLocal(key, buffer);
  return { url, size: file.size, type: file.type, name: file.name };
}

/** Local driver only: read a stored file for /api/files/[...path]. */
export async function readUpload(relPath: string) {
  const normalized = path.posix.normalize(relPath).replace(/^(\.\.(\/|$))+/, "");
  const abs = path.join(/* turbopackIgnore: true */ root(), normalized);
  if (!abs.startsWith(root())) return null;
  try {
    const info = await stat(abs);
    if (!info.isFile()) return null;
    const ext = path.extname(abs).slice(1);
    const type = Object.entries(ALLOWED).find(([, e]) => e === ext)?.[0] ?? "application/octet-stream";
    return { data: await readFile(abs), type, size: info.size };
  } catch {
    return null;
  }
}
