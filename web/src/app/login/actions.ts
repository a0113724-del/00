"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/data";
import { endSession, startSession } from "@/lib/session";

export interface LoginState { error?: string }

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { error: "اكتب بريد إلكتروني صحيح." };
  const name = email.split("@")[0].slice(0, 60);
  const user = (await db.getUserByEmail(email)) ?? (await db.createUser(email, name));
  await startSession(user.id);
  redirect("/");
}

export async function logout() {
  await endSession();
  redirect("/login");
}
