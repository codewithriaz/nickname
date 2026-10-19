import { authed } from "@/server/http/handler";
import { badRequest } from "@/server/http/errors";
import { rateLimit } from "@/server/http/rate-limit";
import { created } from "@/server/http/response";
import { saveUpload } from "@/server/storage";

/** multipart/form-data: file=<File>, kind=images|files */
export const POST = authed(async (req, { auth }) => {
  rateLimit(`upload:${auth.userId}`, 60, 60 * 60 * 1000);
  const form = await req.formData();
  const file = form.get("file");
  const kind = form.get("kind") === "files" ? "files" : "images";
  if (!(file instanceof File)) throw badRequest("No file uploaded");
  return created(await saveUpload(file, kind, auth.userId));
});
