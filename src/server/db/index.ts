import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { serverEnv } from "@/env";
import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;

// Reuse one pool across dev hot reloads instead of opening a new one per reload.
const globalForDb = globalThis as unknown as { xuyeDb?: Database };

/** Lazily connects so importing this module never needs DATABASE_URL at build time. */
export function getDb(): Database {
  if (!globalForDb.xuyeDb) {
    const client = postgres(serverEnv().DATABASE_URL, { max: 10 });
    globalForDb.xuyeDb = drizzle(client, { schema });
  }
  return globalForDb.xuyeDb;
}
