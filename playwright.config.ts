import { defineConfig, devices } from "@playwright/test";
import { e2eDatabaseUrl } from "./tests/e2e/env";

const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://localhost:${PORT}`;
// Locally use the installed Chrome; CI uses Playwright's Chromium. PW_CHANNEL overrides.
const channel = process.env.PW_CHANNEL ?? (process.env.CI ? undefined : "chrome");

// E2E needs PostgreSQL and Mailpit running (`docker compose up -d db mailpit`).
// It uses its own database (<DATABASE_URL name>_e2e), created and migrated by
// scripts/e2e-prepare.ts, so development data is never touched.
// CI runs against the production standalone build; locally it starts `next dev`.
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel } },
    { name: "mobile", use: { ...devices["Pixel 7"], channel } },
  ],
  webServer: {
    command: `pnpm e2e:prepare && ${process.env.CI ? "pnpm start" : `pnpm dev --port ${PORT}`}`,
    url: `${baseURL}/api/v1/health`,
    env: {
      PORT: String(PORT),
      HOSTNAME: "localhost",
      AUTH_URL: baseURL,
      DATABASE_URL: e2eDatabaseUrl(),
      E2E_DATABASE_URL: e2eDatabaseUrl(),
    },
    // Never reuse a server: it might be pointed at the development database.
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
