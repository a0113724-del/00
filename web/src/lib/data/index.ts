import "server-only";
import type { DataStore } from "./store";
import { localStore } from "./local";

// DATA_BACKEND=supabase will switch here once the Supabase adapter exists.
export const db: DataStore = localStore;
