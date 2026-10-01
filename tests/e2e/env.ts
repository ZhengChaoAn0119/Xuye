// Shared by playwright.config.ts, scripts/e2e-prepare.ts, and specs.
// E2E runs against its own database so it never touches development data.

for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // file not present; rely on the process environment
  }
}

export function e2eDatabaseUrl(): string {
  if (process.env.E2E_DATABASE_URL) return process.env.E2E_DATABASE_URL;
  const base = process.env.DATABASE_URL;
  if (!base) throw new Error("DATABASE_URL is not set (copy .env.example to .env)");
  const url = new URL(base);
  url.pathname = `/${url.pathname.slice(1) || "xuye"}_e2e`;
  return url.toString();
}

export const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://localhost:8025";
