import "server-only";
import type { AiSetup, Style } from "../types";
import { buildPrompt, PROMPT_VERSION } from "./prompt";
import { validateSetup } from "./validate";
import { mock, pickProvider, ProviderError, type ProviderResult } from "./providers";

export interface AnalysisOutcome extends ProviderResult { warnings: string[]; promptVersion: string; fallbackReason?: string }

/** Ask the model, validate, re-ask once with the errors, else downgrade to "no trade". */
export async function analyzeChart(img: Buffer, mime: string, style: Style, note?: string, lastPrice?: number): Promise<AnalysisOutcome> {
  let provider = pickProvider();
  let fallbackReason: string | undefined;
  const call = async (errs?: string[]) => {
    try { return await provider.analyze(img, mime, buildPrompt(style, { lastPrice }, note, errs)); }
    catch (e) {
      // Network blocked / no key in development: fall back to the demo provider only if allowed.
      if (e instanceof ProviderError && (e.kind === "network" || e.kind === "auth") && process.env.AI_FALLBACK_MOCK === "1" && provider !== mock) {
        fallbackReason = e.message; provider = mock;
        return provider.analyze(img, mime, buildPrompt(style, { lastPrice }, note, errs));
      }
      throw e;
    }
  };

  let r = await call();
  let v = validateSetup(r.setup, style, lastPrice);
  if (!v.ok) {
    r = await call(v.errors);
    v = validateSetup(r.setup, style, lastPrice);
  }
  if (!v.ok) {
    const none: AiSetup = { ...r.setup, direction: "none", entry_low: null, entry_high: null, sl: null, tp1: null, tp2: null,
      rationale_ar: "ما طلع تحليل بمستويات منطقية من هالصورة، فما نعطيك صفقة. جرب صورة أوضح بيها أرقام السعر، أو فريم ثاني." };
    return { ...r, setup: none, warnings: [...v.warnings, "التحليل الأولي ما نجح بالفحص، فحولناه إلى: ماكو صفقة."], promptVersion: PROMPT_VERSION, fallbackReason };
  }
  return { ...r, warnings: v.warnings, promptVersion: PROMPT_VERSION, fallbackReason };
}
