import type { StoredSetup, User } from "../types";

/**
 * Data layer contract. Screens and routes only use this interface.
 * `local` (JSON files in .data/) is used until Supabase keys exist;
 * a `supabase` implementation with the same signatures replaces it later.
 */
export interface DataStore {
  getUserByEmail(email: string): Promise<User | null>;
  getUser(id: string): Promise<User | null>;
  createUser(email: string, displayName: string): Promise<User>;

  usageToday(userId: string): Promise<number>;
  /** Atomically increments today's analysis count if below `limit`; returns false when the limit is reached. */
  tryConsumeAnalysis(userId: string, limit: number): Promise<boolean>;
  refundAnalysis(userId: string): Promise<void>;

  saveChart(userId: string, bytes: Buffer, ext: string): Promise<string>;
  readChart(path: string): Promise<Buffer | null>;

  insertSetup(s: StoredSetup): Promise<StoredSetup>;
  listSetups(userId: string): Promise<StoredSetup[]>;
  getSetup(userId: string, id: string): Promise<StoredSetup | null>;
  updateSetup(userId: string, id: string, patch: Partial<StoredSetup>): Promise<StoredSetup | null>;
}
