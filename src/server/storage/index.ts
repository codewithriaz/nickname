import "server-only";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { customAlphabet } from "nanoid";
import { env } from "../env";
import { badRequest } from "../http/errors";

/**
 * Storage adapter. Default: local disk (UPLOAD_DIR) served by /api/files/[...path].
 * To move to S3/R2, implement the same `save`/`read` functions and switch here.
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
/** Verify the file's real signature matches its declared image type (prevents spoofed uploads). */
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

const root = () => path.resolve(/* turbopackIgnore: true */ process.cwd(), env().UPLOAD_DIR);

export async function saveUpload(file: File, folder: "images" | "files", ownerId: string) {
  const ext = ALLOWED[file.type];
  if (!ext) throw badRequest("Unsupported file type");
  if (folder === "images" && !file.type.startsWith("image/")) throw badRequest("Only images allowed");
  const maxBytes = env().MAX_UPLOAD_MB * 1024 * 1024 * (folder === "files" ? 4 : 1);
  if (file.size > maxBytes) throw badRequest(`File too large (max ${Math.round(maxBytes / 1048576)}MB)`);

  const safeOwner = ownerId.replace(/[^a-zA-Z0-9]/g, "");
  const rel = path.posix.join(folder, safeOwner, `${fileId()}.${ext}`);
  const abs = path.join(/* turbopackIgnore: true */ root(), rel);
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!matchesSignature(file.type, buffer)) throw badRequest("File content doesn't match its type");
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, buffer);
  return { url: `/api/files/${rel}`, size: file.size, type: file.type, name: file.name };
}

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
