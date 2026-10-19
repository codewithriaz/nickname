import type { NextRequest } from "next/server";
import { readUpload } from "@/server/storage";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const file = await readUpload(path.join("/"));
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.type,
      "Content-Length": String(file.size),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      ...(file.type.startsWith("image/") ? {} : { "Content-Disposition": "attachment" }),
    },
  });
}
