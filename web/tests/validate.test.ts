import { test } from "node:test";
import assert from "node:assert/strict";
import { validateSetup } from "../src/lib/ai/validate";
import { buildPrompt } from "../src/lib/ai/prompt";
import type { AiSetup } from "../src/lib/types";

const base: AiSetup = { is_gold_chart: true, symbol_seen: "XAUUSD", timeframe_seen: "M15", price_seen: 4070, direction: "buy",
  entry_low: 4069, entry_high: 4071, sl: 4062, tp1: 4082, tp2: 4092, invalidation: "x", confidence: "medium", rationale_ar: "x",
  strategies_matched: [{ id: "sr_bounce", note_ar: "ok" }, { id: "made_up", note_ar: "?" }], primary_strategy: "sr_bounce", confluence_score: 140 };

test("good buy passes and strategies are sanitised", () => {
  const s = structuredClone(base); const v = validateSetup(s, "scalp");
  assert.equal(v.ok, true, v.errors.join());
  assert.deepEqual(s.strategies_matched.map((m) => m.id), ["sr_bounce"]);
  assert.equal(s.confluence_score, 100);
});
test("stop on the wrong side fails", () => {
  const v = validateSetup({ ...structuredClone(base), sl: 4075 }, "scalp"); assert.equal(v.ok, false);
});
test("reward < risk fails", () => {
  const v = validateSetup({ ...structuredClone(base), tp1: 4074 }, "scalp"); assert.equal(v.ok, false);
});
test("scalp stop too wide fails, same stop is fine for swing", () => {
  const s = { ...structuredClone(base), sl: 4020, tp1: 4140, tp2: 4180 };
  assert.equal(validateSetup(structuredClone(s), "scalp").ok, false);
  assert.equal(validateSetup(structuredClone(s), "swing").ok, true);
});
test("trade without a primary strategy fails", () => {
  const v = validateSetup({ ...structuredClone(base), primary_strategy: null, strategies_matched: [] }, "scalp"); assert.equal(v.ok, false);
});
test("unknown primary strategy is dropped (and then fails)", () => {
  const v = validateSetup({ ...structuredClone(base), primary_strategy: "nope" }, "scalp"); assert.equal(v.ok, false);
});
test("none is always ok", () => {
  assert.equal(validateSetup({ ...structuredClone(base), direction: "none", sl: null, tp1: null }, "scalp").ok, true);
});
test("sell geometry", () => {
  const s: AiSetup = { ...structuredClone(base), direction: "sell", entry_low: 4069, entry_high: 4071, sl: 4078, tp1: 4058, tp2: 4050 };
  assert.equal(validateSetup(s, "scalp").ok, true);
});
test("entry far from current price fails", () => {
  assert.equal(validateSetup(structuredClone(base), "scalp", 4200).ok, false);
});
test("prompt size and forced strategy", () => {
  const all = buildPrompt("scalp", {}); const one = buildPrompt("scalp", {}, undefined, undefined, "orb_europe");
  console.log("prompt chars: auto", all.length, "single", one.length);
  assert.ok(all.includes("[liquidity_sweep]") && !one.includes("[liquidity_sweep]") && one.includes("[orb_europe]"));
});
