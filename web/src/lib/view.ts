import type { Setup } from "@/components/TradeSetupCard";
import type { StoredSetup } from "./types";
import { strategyName } from "./ai/strategies";

export function toCard(s: StoredSetup): Setup {
  return {
    direction: s.direction, style: s.style, source: "ai", confidence: s.confidence,
    entryLow: s.entryLow, entryHigh: s.entryHigh, sl: s.sl, tp1: s.tp1, tp2: s.tp2,
    invalidation: s.invalidation, rationale: s.rationale, status: s.status, createdAt: s.createdAt,
    strategies: (s.strategies ?? []).map((x) => ({ name: strategyName(x.id), primary: x.id === s.primaryStrategy })),
    confluence: s.direction === "none" ? undefined : s.confluence,
  };
}

/** pending setups past validUntil are shown as expired until the grading job (M2) writes it. */
export function effectiveStatus(s: StoredSetup): StoredSetup {
  return s.status === "pending" && new Date(s.validUntil) < new Date() ? { ...s, status: "expired" } : s;
}
