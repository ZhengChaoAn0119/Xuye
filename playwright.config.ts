import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://localhost:${PORT}`;
// Locally use the installed Chrome; CI uses Playwright's Chromium. PW_CHANNEL overrides.
const channel = process.env.PW_CHANNEL ?? (process.env.CI ? undefined : "chrome");

// E2E needs PostgreSQL (migrated) and Mailpit: `docker compose up -d db mailpit` + `pnpm db:migrate`.
// CI runs against the production standalone build; locally it reuses or starts `next dev`.
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
    command: process.env.CI ? "pnpm start" : `pnpm dev --port ${PORT}`,
    url: `${baseURL}/api/v1/health`,
    env: { PORT: String(PORT), HOSTNAME: "localhost" },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
