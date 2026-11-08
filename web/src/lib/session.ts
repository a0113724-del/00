import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./data";
import type { User } from "./types";

/**
 * Dev session: signed cookie with the user id.
 * Replaced by Supabase Auth (magic link / Google) in replica-backend; same getUser() signature.
 */
const COOKIE = "sb_session";
const SECRET = process.env.SESSION_SECRET || "dev-only-secret-change-me";

const sign = (v: string) => `${v}.${crypto.createHmac("sha256", SECRET).update(v).digest("base64url")}`;
function unsign(s: string | undefined) {
  if (!s) return null;
  const i = s.lastIndexOf(".");
  const v = s.slice(0, i);
  const good = sign(v);
  return good.length === s.length && crypto.timingSafeEqual(Buffer.from(good), Buffer.from(s)) ? v : null;
}

export async function getUser(): Promise<User | null> {
  const id = unsign((await cookies()).get(COOKIE)?.value);
  return id ? db.getUser(id) : null;
}
export async function requireUser(): Promise<User> {
  const u = await getUser();
  if (!u) redirect("/login");
  return u;
}
export async function startSession(userId: string) {
  (await cookies()).set(COOKIE, sign(userId), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
}
export async function endSession() { (await cookies()).delete(COOKIE); }
