import type { AiSetup, Style } from "../types";
import { STRATEGY_IDS } from "./strategies";

export interface Validation { ok: boolean; errors: string[]; warnings: string[] }

/** Stop distance limits as % of price (no ATR available in the vertical slice; ATR rules come with market data in M2). */
const STOP_PCT: Record<Style, [number, number]> = { scalp: [0.04, 0.8], swing: [0.15, 3.0] };

/** Keep only known strategy ids, dedupe, clamp the score. Mutates and returns s. */
export function sanitiseStrategies(s: AiSetup): AiSetup {
  const seen = new Set<string>();
  s.strategies_matched = (Array.isArray(s.strategies_matched) ? s.strategies_matched : [])
    .filter((m) => m && STRATEGY_IDS.includes(m.id) && !seen.has(m.id) && seen.add(m.id))
    .map((m) => ({ id: m.id, note_ar: String(m.note_ar ?? "").slice(0, 200) }));
  if (s.primary_strategy && !STRATEGY_IDS.includes(s.primary_strategy)) s.primary_strategy = null;
  if (s.primary_strategy && !seen.has(s.primary_strategy)) s.strategies_matched.unshift({ id: s.primary_strategy, note_ar: "" });
  s.confluence_score = Math.max(0, Math.min(100, Math.round(Number(s.confluence_score) || 0)));
  return s;
}

export function validateSetup(s: AiSetup, style: Style, lastPrice?: number): Validation {
  const errors: string[] = []; const warnings: string[] = [];
  sanitiseStrategies(s);
  if (!s.is_gold_chart) return { ok: true, errors, warnings: ["الصورة ما تبين إنها شارت ذهب"] };
  if (s.direction === "none") return { ok: true, errors, warnings };

  const { entry_low: el, entry_high: eh, sl, tp1, tp2 } = s;
  if ([el, eh, sl, tp1].some((v) => typeof v !== "number" || !isFinite(v) || v <= 0)) {
    return { ok: false, errors: ["entry_low/entry_high/sl/tp1 must be positive numbers"], warnings };
  }
  const lo = Math.min(el!, eh!), hi = Math.max(el!, eh!);
  const mid = (lo + hi) / 2;
  if (s.direction === "buy") {
    if (!(sl! < lo)) errors.push("buy: sl must be below entry_low");
    if (!(tp1! > hi)) errors.push("buy: tp1 must be above entry_high");
    if (tp2 != null && !(tp2 > tp1!)) errors.push("buy: tp2 must be above tp1");
  } else {
    if (!(sl! > hi)) errors.push("sell: sl must be above entry_high");
    if (!(tp1! < lo)) errors.push("sell: tp1 must be below entry_low");
    if (tp2 != null && !(tp2 < tp1!)) errors.push("sell: tp2 must be below tp1");
  }
  const worstEntry = s.direction === "buy" ? hi : lo;
  const risk = Math.abs(worstEntry - sl!);
  const reward = Math.abs(tp1! - worstEntry);
  if (risk > 0 && reward / risk < 1) errors.push(`reward/risk for tp1 is ${(reward / risk).toFixed(2)}, must be >= 1 (measured from the worst entry)`);
  const stopPct = (Math.abs(mid - sl!) / mid) * 100;
  const [mn, mx] = STOP_PCT[style];
  if (stopPct < mn || stopPct > mx) errors.push(`stop distance ${stopPct.toFixed(2)}% of price is outside ${mn}-${mx}% for ${style}`);
  if ((hi - lo) / mid * 100 > STOP_PCT[style][1] / 2) errors.push("entry zone too wide");

  const ref = lastPrice ?? s.price_seen ?? undefined;
  if (ref && Math.abs(mid - ref) / ref > (style === "scalp" ? 0.006 : 0.03)) {
    errors.push(`entry ${mid.toFixed(2)} is too far from the current price ${ref}`);
  }
  if (lastPrice && s.price_seen && Math.abs(s.price_seen - lastPrice) / lastPrice > 0.006) {
    warnings.push(`سعر الصورة (${s.price_seen}) يختلف عن السعر الحالي (${lastPrice}). يمكن الصورة قديمة.`);
  }
  if (!s.primary_strategy) errors.push("primary_strategy is required when direction is buy or sell");
  if (s.confluence_score < 40) warnings.push("توافق الأسباب ضعيف لهالصفقة.");
  if (s.confidence === "low") warnings.push("ثقة التحليل منخفضة. تعامل وياه بحذر.");
  return { ok: errors.length === 0, errors, warnings };
}
