import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import type { DataStore } from "./store";
import type { StoredSetup, User } from "../types";

const ROOT = path.join(process.cwd(), ".data");
const DB = path.join(ROOT, "db.json");

interface Shape { users: User[]; setups: StoredSetup[]; usage: Record<string, number> }

let lock: Promise<unknown> = Promise.resolve();
/** serialise read-modify-write so two requests never lose an update */
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = lock.then(fn, fn);
  lock = run.catch(() => undefined);
  return run;
}

async function load(): Promise<Shape> {
  try { return JSON.parse(await fs.readFile(DB, "utf8")); }
  catch { return { users: [], setups: [], usage: {} }; }
}
async function save(d: Shape) {
  await fs.mkdir(ROOT, { recursive: true });
  const tmp = DB + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(d, null, 1));
  await fs.rename(tmp, DB);
}
const today = () => new Date().toISOString().slice(0, 10);

export const localStore: DataStore = {
  async getUserByEmail(email) { return (await load()).users.find((u) => u.email === email) ?? null; },
  async getUser(id) { return (await load()).users.find((u) => u.id === id) ?? null; },
  createUser: (email, displayName) => withLock(async () => {
    const d = await load();
    const existing = d.users.find((u) => u.email === email);
    if (existing) return existing;
    const u: User = { id: crypto.randomUUID(), email, displayName, tier: "free", createdAt: new Date().toISOString() };
    d.users.push(u); await save(d); return u;
  }),

  async usageToday(userId) { return (await load()).usage[`${userId}:${today()}`] ?? 0; },
  tryConsumeAnalysis: (userId, limit) => withLock(async () => {
    const d = await load(); const k = `${userId}:${today()}`;
    const n = d.usage[k] ?? 0;
    if (n >= limit) return false;
    d.usage[k] = n + 1; await save(d); return true;
  }),
  refundAnalysis: (userId) => withLock(async () => {
    const d = await load(); const k = `${userId}:${today()}`;
    d.usage[k] = Math.max(0, (d.usage[k] ?? 1) - 1); await save(d);
  }),

  async saveChart(userId, bytes, ext) {
    const rel = path.join("charts", userId, `${crypto.randomUUID()}.${ext}`);
    const abs = path.join(ROOT, rel);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, bytes);
    return rel;
  },
  async readChart(rel) {
    const abs = path.join(ROOT, rel);
    if (!abs.startsWith(path.join(ROOT, "charts"))) return null; // no path traversal
    try { return await fs.readFile(abs); } catch { return null; }
  },

  insertSetup: (s) => withLock(async () => { const d = await load(); d.setups.push(s); await save(d); return s; }),
  async listSetups(userId) {
    return (await load()).setups.filter((s) => s.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async getSetup(userId, id) { return (await load()).setups.find((s) => s.userId === userId && s.id === id) ?? null; },
  updateSetup: (userId, id, patch) => withLock(async () => {
    const d = await load(); const s = d.setups.find((x) => x.userId === userId && x.id === id);
    if (!s) return null;
    Object.assign(s, patch); await save(d); return s;
  }),
};
