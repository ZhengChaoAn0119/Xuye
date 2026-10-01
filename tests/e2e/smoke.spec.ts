import { expect, test } from "@playwright/test";

test("home page renders in Traditional Chinese", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-Hant");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("正式版建置中");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
});

test("health endpoint reports the database as reachable", async ({ request }) => {
  const response = await request.get("/api/v1/health");
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ status: "ok", database: "ok" });
});

test("auth endpoint lists the configured email provider", async ({ request }) => {
  const response = await request.get("/api/auth/providers");
  expect(response.ok()).toBe(true);
  expect(Object.keys(await response.json())).toContain("nodemailer");
});
