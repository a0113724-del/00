import "server-only";
import crypto from "crypto";
import type { AiSetup, Style } from "../types";
import { SETUP_SCHEMA } from "./prompt";

export interface ProviderResult { setup: AiSetup; provider: string; model: string; mock: boolean }
export interface Provider { name: string; analyze(img: Buffer, mime: string, prompt: string): Promise<ProviderResult> }

export class ProviderError extends Error {
  constructor(message: string, public kind: "network" | "quota" | "auth" | "bad_output" | "other") { super(message); }
}

function upperSchema(s: unknown): unknown {
  // Gemini responseSchema uses OpenAPI-style uppercase types
  if (Array.isArray(s)) return s.map(upperSchema);
  if (s && typeof s === "object") {
    const o: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(s)) o[k] = k === "type" && typeof v === "string" ? v.toUpperCase() : upperSchema(v);
    return o;
  }
  return s;
}

function parseJson(text: string): AiSetup {
  const t = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try { return JSON.parse(t) as AiSetup; } catch { throw new ProviderError("model did not return JSON", "bad_output"); }
}

async function post(url: string, headers: Record<string, string>, body: unknown) {
  let res: Response;
  try {
    res = await fetch(url, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body), signal: AbortSignal.timeout(60_000) });
  } catch (e) {
    throw new ProviderError(`network: ${(e as Error).message}`, "network");
  }
  if (res.status === 429) throw new ProviderError("rate limit / quota", "quota");
  if (res.status === 401 || res.status === 403) throw new ProviderError("bad or unauthorised API key", "auth");
  if (!res.ok) throw new ProviderError(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`, "other");
  return res.json();
}

export const gemini: Provider = {
  name: "gemini",
  async analyze(img, mime, prompt) {
    const key = process.env.GEMINI_API_KEY; const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    if (!key) throw new ProviderError("GEMINI_API_KEY missing", "auth");
    const j = await post(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, { "x-goog-api-key": key }, {
      contents: [{ role: "user", parts: [{ text: prompt }, { inline_data: { mime_type: mime, data: img.toString("base64") } }] }],
      generationConfig: { temperature: 0.2, responseMimeType: "application/json", responseSchema: upperSchema(SETUP_SCHEMA) },
    });
    const text = j?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
    if (!text) throw new ProviderError(`empty response (${j?.candidates?.[0]?.finishReason ?? j?.promptFeedback?.blockReason ?? "unknown"})`, "bad_output");
    return { setup: parseJson(text), provider: "gemini", model, mock: false };
  },
};

export const claude: Provider = {
  name: "claude",
  async analyze(img, mime, prompt) {
    const key = process.env.ANTHROPIC_API_KEY; const model = process.env.CLAUDE_MODEL || "claude-sonnet-5-5";
    if (!key) throw new ProviderError("ANTHROPIC_API_KEY missing", "auth");
    const j = await post("https://api.anthropic.com/v1/messages", { "x-api-key": key, "anthropic-version": "2023-06-01" }, {
      model, max_tokens: 1200, temperature: 0.2,
      tools: [{ name: "submit_setup", description: "Submit the gold chart trade analysis", input_schema: SETUP_SCHEMA }],
      tool_choice: { type: "tool", name: "submit_setup" },
      messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: mime, data: img.toString("base64") } }, { type: "text", text: prompt }] }],
    });
    const tool = j?.content?.find((c: { type: string }) => c.type === "tool_use");
    if (!tool?.input) throw new ProviderError("no tool output", "bad_output");
    return { setup: tool.input as AiSetup, provider: "claude", model, mock: false };
  },
};

/** Offline demo provider: plausible setup derived from the image hash. Always flagged mock=true in the UI. */
export const mock: Provider = {
  name: "mock",
  async analyze(img, _mime, prompt) {
    const h = crypto.createHash("sha256").update(img).digest();
    const style: Style = prompt.includes("سوينگ") ? "swing" : "scalp";
    const base = 4000 + (h[0] * 256 + h[1]) % 300 + h[2] / 100;
    const dir = h[3] % 5 === 0 ? "none" : h[3] % 2 ? "buy" : "sell";
    const unit = style === "scalp" ? 4 + (h[4] % 6) : 18 + (h[4] % 20);
    const s = dir === "buy" ? 1 : -1;
    const r = (n: number) => Math.round(n * 100) / 100;
    await new Promise((res) => setTimeout(res, 900));
    return {
      provider: "mock", model: "mock-v1", mock: true,
      setup: dir === "none" ? {
        is_gold_chart: true, symbol_seen: "XAUUSD", timeframe_seen: style === "scalp" ? "M15" : "H4", price_seen: r(base), direction: "none",
        entry_low: null, entry_high: null, sl: null, tp1: null, tp2: null, invalidation: "",
        confidence: "low", rationale_ar: "هذا تحليل تجريبي. السعر يتحرك بنطاق ضيق وماكو كسر واضح، فالأفضل الانتظار.",
      } : {
        is_gold_chart: true, symbol_seen: "XAUUSD", timeframe_seen: style === "scalp" ? "M15" : "H4", price_seen: r(base),
        direction: dir, entry_low: r(base - unit * 0.15), entry_high: r(base + unit * 0.15),
        sl: r(base - s * unit - (s > 0 ? unit * 0.15 : -unit * 0.15)),
        tp1: r(base + s * unit * 1.6), tp2: r(base + s * unit * 2.6),
        invalidation: `إغلاق شمعة ${style === "scalp" ? "15 دقيقة" : "4 ساعات"} ${dir === "buy" ? "تحت" : "فوگ"} ${r(base - s * unit)}`,
        confidence: (["low", "medium", "high"] as const)[h[5] % 3],
        rationale_ar: `هذا تحليل تجريبي لعرض شكل النتيجة. السعر ${dir === "buy" ? "رجع لمنطقة دعم بعد موجة صعود" : "وصل لمقاومة بعد موجة هبوط"}، والهدف الأول قبل المستوى الجاي.`,
      },
    };
  },
};

export function pickProvider(): Provider {
  const p = (process.env.AI_PROVIDER || "mock").toLowerCase();
  if (p === "gemini") return gemini;
  if (p === "claude") return claude;
  return mock;
}
