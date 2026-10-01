/**
 * Create (if needed) and migrate the dedicated E2E database.
 * Run automatically by Playwright's webServer command before the app starts.
 */
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { createDb } from "@/server/db/client";
import { e2eDatabaseUrl } from "../tests/e2e/env";

async function main() {
  const url = new URL(e2eDatabaseUrl());
  const name = url.pathname.slice(1);
  if (!/^[a-z0-9_]+$/i.test(name)) throw new Error(`Unsafe database name: ${name}`);

  const maintenance = new URL(url);
  maintenance.pathname = "/postgres";
  const admin = postgres(maintenance.toString(), { max: 1, onnotice: () => {} });
  try {
    const [exists] = await admin`select 1 from pg_database where datname = ${name}`;
    if (!exists) await admin.unsafe(`create database "${name}"`);
  } finally {
    await admin.end();
  }

  const { db, close } = createDb(url.toString(), { max: 1 });
  try {
    await migrate(db, { migrationsFolder: "drizzle" });
  } finally {
    await close();
  }
  console.log(`E2E database ready: ${name}`);
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
