import { defineConfig } from "drizzle-kit";

// drizzle-kit runs outside Next.js, so load .env files ourselves when present.
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // file not present; rely on the process environment
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set (copy .env.example to .env)");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL },
  strict: true,
  verbose: true,
});
