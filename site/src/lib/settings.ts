const K = { key: "sabika.geminiKey", model: "sabika.geminiModel", name: "sabika.name" };

export const DEFAULT_MODEL = "gemini-2.5-flash";
export const MODELS = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.5-flash-lite"];

function get(k: string) { try { return localStorage.getItem(k) ?? ""; } catch { return ""; } }
function set(k: string, v: string) { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch { /* storage blocked */ } }

export const settings = {
  getKey: () => get(K.key),
  setKey: (v: string) => set(K.key, v.trim()),
  getModel: () => get(K.model) || DEFAULT_MODEL,
  setModel: (v: string) => set(K.model, v),
  getName: () => get(K.name),
  setName: (v: string) => set(K.name, v.trim().slice(0, 60)),
};
