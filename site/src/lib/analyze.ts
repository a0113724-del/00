import { buildPrompt, PROMPT_VERSION, SETUP_SCHEMA } from "@/lib/ai/prompt";
import { validateSetup } from "@/lib/ai/validate";
import type { AiSetup, StoredSetup, Style } from "@/lib/types";
import { settings } from "./settings";

export class AnalyzeError extends Error {
  kind: "nokey" | "network" | "quota" | "auth" | "bad_output" | "other";
  constructor(message: string, kind: AnalyzeError["kind"]) { super(message); this.kind = kind; }
}

function upper(s: unknown): unknown {
  if (Array.isArray(s)) return s.map(upper);
  if (s && typeof s === "object") {
    const o: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(s)) o[k] = k === "type" && typeof v === "string" ? v.toUpperCase() : upper(v);
    return o;
  }
  return s;
}

/** Downscale to ≤1600px JPEG so uploads are fast and cheap; returns blob + base64. */
export async function prepareImage(file: File): Promise<{ blob: Blob; b64: string; mime: string }> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  const blob: Blob = await new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("encode"))), "image/jpeg", 0.9));
  const b64 = await new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(",")[1]); r.readAsDataURL(blob); });
  return { blob, b64, mime: "image/jpeg" };
}

async function callGemini(b64: string, mime: string, prompt: string): Promise<AiSetup> {
  const key = settings.getKey(); const model = settings.getModel();
  if (!key) throw new AnalyzeError("أضف مفتاح Gemini من صفحة حسابي أول.", "nokey");
  let res: Response;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }, { inline_data: { mime_type: mime, data: b64 } }] }],
        generationConfig: { temperature: 0.2, responseMimeType: "application/json", responseSchema: upper(SETUP_SCHEMA) },
      }),
    });
  } catch { throw new AnalyzeError("ما گدرنا نوصل لـ Gemini. تأكد من الإنترنت.", "network"); }
  if (res.status === 429) throw new AnalyzeError("وصلت حد Gemini المجاني. انتظر دقيقة أو للغد.", "quota");
  if (res.status === 400 || res.status === 401 || res.status === 403) {
    const t = await res.text();
    if (/API key|API_KEY|PERMISSION|location/i.test(t)) throw new AnalyzeError(/location/i.test(t) ? "Gemini مو متوفر بمنطقتك." : "مفتاح Gemini غلط أو ما مفعّل.", "auth");
    throw new AnalyzeError(`Gemini رفض الطلب: ${t.slice(0, 160)}`, "other");
  }
  if (!res.ok) throw new AnalyzeError(`خطأ من Gemini (${res.status}).`, "other");
  const j = await res.json();
  const text: string = j?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
  if (!text) throw new AnalyzeError("Gemini رجع رد فارغ. جرب صورة ثانية.", "bad_output");
  try { return JSON.parse(text.replace(/^```(?:json)?|```$/g, "").trim()); }
  catch { throw new AnalyzeError("Gemini رجع رد بشكل غلط. جرب مرة ثانية.", "bad_output"); }
}

export async function analyze(file: File, style: Style, note?: string, only?: string): Promise<{ setup: StoredSetup; blob: Blob }> {
  const { blob, b64, mime } = await prepareImage(file);
  let s = await callGemini(b64, mime, buildPrompt(style, {}, note, undefined, only));
  let v = validateSetup(s, style);
  if (!v.ok) { s = await callGemini(b64, mime, buildPrompt(style, {}, note, v.errors, only)); v = validateSetup(s, style); }
  const warnings = [...v.warnings];
  if (!v.ok) {
    s = { ...s, direction: "none", primary_strategy: null, entry_low: null, entry_high: null, sl: null, tp1: null, tp2: null,
      rationale_ar: "ما طلع تحليل بمستويات منطقية من هالصورة، فما نعطيك صفقة. جرب صورة أوضح بيها أرقام السعر." };
    warnings.push("التحليل الأولي ما نجح بالفحص، فحولناه إلى: ماكو صفقة.");
  }
  const now = new Date();
  const setup: StoredSetup = {
    id: crypto.randomUUID(), userId: "device", source: "ai", style, direction: s.direction,
    entryLow: s.entry_low ?? undefined, entryHigh: s.entry_high ?? undefined, sl: s.sl ?? undefined, tp1: s.tp1 ?? undefined, tp2: s.tp2 ?? undefined,
    invalidation: s.invalidation || undefined, confidence: s.confidence, rationale: s.rationale_ar,
    timeframeSeen: s.timeframe_seen, priceSeen: s.price_seen ?? undefined,
    status: s.direction === "none" ? "no_trade" : "pending",
    validUntil: new Date(now.getTime() + (style === "scalp" ? 4 : 120) * 3600_000).toISOString(),
    createdAt: now.toISOString(), imagePath: "", provider: "gemini", model: settings.getModel(), promptVersion: PROMPT_VERSION, mock: false,
    warnings, note, strategies: s.strategies_matched.map((m) => ({ id: m.id, note: m.note_ar })),
    primaryStrategy: s.primary_strategy ?? undefined, confluence: s.confluence_score, requestedStrategy: only,
  };
  return { setup, blob };
}

/** Lightweight key check without an image. */
export async function testKey(key: string, model: string): Promise<string | null> {
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Reply with OK" }] }] }),
    });
    if (r.ok) return null;
    const t = await r.text();
    if (r.status === 429) return "المفتاح شغال بس وصلت الحد هسه.";
    if (/location/i.test(t)) return "Gemini مو متوفر بمنطقتك.";
    return "المفتاح غلط أو ما مفعّل.";
  } catch { return "ما گدرنا نوصل لـ Gemini. تأكد من الإنترنت."; }
}
