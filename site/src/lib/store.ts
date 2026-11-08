import { createStore, get, set, del, keys } from "idb-keyval";
import type { StoredSetup } from "@/lib/types";

/** On-device storage (IndexedDB). Nothing leaves the phone except the image sent to Gemini. */
const setupsDb = createStore("sabika", "setups");
const imagesDb = createStore("sabika-img", "images");

export async function saveSetup(s: StoredSetup, image: Blob) {
  await set(s.id, image, imagesDb);
  await set(s.id, s, setupsDb);
}
export async function listSetups(): Promise<StoredSetup[]> {
  const ids = await keys(setupsDb);
  const all = await Promise.all(ids.map((k) => get<StoredSetup>(k, setupsDb)));
  return all.filter(Boolean).sort((a, b) => b!.createdAt.localeCompare(a!.createdAt)) as StoredSetup[];
}
export const getSetup = (id: string) => get<StoredSetup>(id, setupsDb);
export const getImage = (id: string) => get<Blob>(id, imagesDb);
export async function deleteSetup(id: string) { await del(id, setupsDb); await del(id, imagesDb); }

const day = () => new Date().toISOString().slice(0, 10);
export function usageToday(): number { try { return Number(localStorage.getItem(`sabika.usage.${day()}`) || 0); } catch { return 0; } }
export function bumpUsage() { try { localStorage.setItem(`sabika.usage.${day()}`, String(usageToday() + 1)); } catch { /* ignore */ } }
