import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;
/** A database handle or an open transaction; services accept either. */
export type DbOrTx = Database | Parameters<Parameters<Database["transaction"]>[0]>[0];

/** Plain factory, free of `server-only`, so CLI scripts and integration tests can use it. */
export function createDb(url: string, options: { max?: number } = {}) {
  const client = postgres(url, { max: options.max ?? 10, onnotice: () => {} });
  return { db: drizzle(client, { schema }) as Database, close: () => client.end() };
}
