export type Style = "scalp" | "swing";
export type Direction = "buy" | "sell" | "none";
export type Confidence = "low" | "medium" | "high";
export type SetupStatus = "pending" | "active" | "tp1" | "tp2" | "tp3" | "sl" | "be" | "expired" | "cancelled" | "no_trade";
export type Tier = "free" | "pro" | "elite";

export interface User {
  id: string;
  email: string;
  displayName: string;
  tier: Tier;
  createdAt: string;
}

/** What the AI must return (validated server-side). */
export interface AiSetup {
  is_gold_chart: boolean;
  symbol_seen: string;
  timeframe_seen: string;
  price_seen: number | null;
  direction: Direction;
  entry_low: number | null;
  entry_high: number | null;
  sl: number | null;
  tp1: number | null;
  tp2: number | null;
  invalidation: string;
  confidence: Confidence;
  rationale_ar: string;
}

export interface StoredSetup {
  id: string;
  userId: string;
  source: "ai";
  style: Style;
  direction: Direction;
  entryLow?: number; entryHigh?: number; sl?: number; tp1?: number; tp2?: number;
  invalidation?: string;
  confidence?: Confidence;
  rationale?: string;
  timeframeSeen?: string;
  priceSeen?: number;
  status: SetupStatus;
  validUntil: string;
  createdAt: string;
  imagePath: string;
  provider: string;
  model: string;
  promptVersion: string;
  mock: boolean;
  warnings: string[];
  note?: string;
}

export const LIMITS: Record<Tier, number> = { free: 3, pro: 30, elite: 100 };
