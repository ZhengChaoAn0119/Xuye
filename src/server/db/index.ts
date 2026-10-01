import "server-only";
import { serverEnv } from "@/env";
import { createDb, type Database } from "./client";

export type { Database, DbOrTx } from "./client";

// Reuse one pool across dev hot reloads instead of opening a new one per reload.
const globalForDb = globalThis as unknown as { xuyeDb?: Database };

/** Lazily connects so importing this module never needs DATABASE_URL at build time. */
export function getDb(): Database {
  globalForDb.xuyeDb ??= createDb(serverEnv().DATABASE_URL).db;
  return globalForDb.xuyeDb;
}
