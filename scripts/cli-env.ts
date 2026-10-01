// Shared setup for CLI scripts: load .env files the way Next.js does, then validate.
import { serverEnv } from "@/env";
import { createDb } from "@/server/db/client";

for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // file not present; rely on the process environment
  }
}

export function openDb() {
  return createDb(serverEnv().DATABASE_URL, { max: 2 });
}
