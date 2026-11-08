import { getUser } from "@/lib/session";
import { db } from "@/lib/data";

export const runtime = "nodejs";

/** Owner-only chart image access (local adapter). Supabase version uses signed URLs. */
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const user = await getUser();
  if (!user) return new Response("unauthorised", { status: 401 });
  const parts = (await params).path;
  if (parts[0] !== user.id) return new Response("not found", { status: 404 });
  const buf = await db.readChart(["charts", ...parts].join("/"));
  if (!buf) return new Response("not found", { status: 404 });
  const ext = parts.at(-1)!.split(".").pop();
  const type = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  return new Response(new Uint8Array(buf), { headers: { "content-type": type, "cache-control": "private, max-age=3600" } });
}
