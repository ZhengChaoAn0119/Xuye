import { expect, test } from "@playwright/test";
import postgres from "postgres";
import { TERMS_VERSION } from "@/lib/terms";
import { e2eDatabaseUrl } from "./env";
import { promoteToAdmin, signIn, uniqueEmail, waitForMagicLink } from "./support";

test("terms are accessible and opting out prevents sign-in", async ({ page }, testInfo) => {
  await page.goto("/terms");
  await expect(page.getByRole("heading", { name: "服務條款", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "七、帳號刪除" })).toBeVisible();
  await expect(page.getByText(`版本與更新日期：${TERMS_VERSION}`)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("terms.png"), fullPage: true });

  await page.goto("/signin");
  const choice = page.getByRole("checkbox", { name: "同意服務條款並知悉隱私權政策" });
  await expect(choice).toBeChecked();
  await page.screenshot({ path: testInfo.outputPath("signin.png"), fullPage: true });
  await choice.uncheck();
  await page.getByLabel("電子郵件").fill(uniqueEmail("declined"));
  await page.getByRole("button", { name: "寄送登入連結" }).click();
  await expect(page).toHaveURL(/consent=declined/);
  await expect(page.locator("main").getByRole("alert")).toContainText("你已選擇不同意");
  await expect(choice).not.toBeChecked();
  expect(await (await page.request.get("/api/auth/session")).json()).toBeNull();
  expect(await page.context().cookies()).not.toEqual(
    expect.arrayContaining([expect.objectContaining({ name: "xuye-terms-intent" })]),
  );
});

test("default agreement is recorded and admin identity and mark are accurate", async ({
  page,
}, testInfo) => {
  const email = uniqueEmail("terms-admin");
  await signIn(page, email);
  const sql = postgres(e2eDatabaseUrl(), { max: 1 });
  try {
    const [user] =
      await sql`select terms_version, terms_accepted_at from users where email = ${email}`;
    expect(user!.terms_version).toBe(TERMS_VERSION);
    expect(user!.terms_accepted_at).toBeTruthy();
    await page.goto("/account");
    await expect(page.locator("main").getByText("免費會員", { exact: true })).toBeVisible();
    await promoteToAdmin(email);
    await page.reload();
    await expect(page.locator("main").getByText("管理員", { exact: true })).toBeVisible();
    await expect(page.locator("main").getByText("免費會員", { exact: true })).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath("account-admin.png"), fullPage: true });
    await page.goto("/admin");
    await expect(page.getByRole("link", { name: "管理後台", exact: true })).toContainText("續");
    await page.screenshot({ path: testInfo.outputPath("admin.png"), fullPage: true });
  } finally {
    await sql.end();
  }
});

test("the shared opt-out also blocks Google before any OAuth redirect", async ({ page }) => {
  await page.goto("/signin");
  const google = page.getByRole("button", { name: "以 Google 繼續" });
  test.skip(!(await google.count()), "Google is not configured in this environment");
  const choice = page.getByRole("checkbox", { name: "同意服務條款並知悉隱私權政策" });
  await expect(choice).toHaveCount(1);
  await choice.uncheck();
  await google.click();
  await expect(page).toHaveURL(/consent=declined/);
  await expect(page.locator("main").getByRole("alert")).toContainText("你已選擇不同意");
  await expect(choice).not.toBeChecked();
  expect(await (await page.request.get("/api/auth/session")).json()).toBeNull();
});

test("legacy accounts cannot bypass consent and retain their data rights", async ({
  page,
}, testInfo) => {
  const email = uniqueEmail("terms-legacy");
  await signIn(page, email);
  const sql = postgres(e2eDatabaseUrl(), { max: 1 });
  try {
    await sql`update users set terms_version = null, terms_accepted_at = null where email = ${email}`;
    await page.goto("/library");
    await expect(page).toHaveURL(/\/consent\?callbackUrl=%2Flibrary/);
    await expect(page.getByRole("heading", { name: "確認使用條款" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: testInfo.outputPath("consent.png"), fullPage: true });
    const response = await page.request.put("/api/v1/me/preferences", {
      data: { siteTheme: "dark" },
    });
    expect(response.status()).toBe(403);
    expect((await response.json()).error).toBe("terms_required");
    expect((await page.request.get("/api/v1/me/export")).ok()).toBe(true);
    await page.getByRole("checkbox", { name: "同意服務條款並知悉隱私權政策" }).uncheck();
    await page.getByRole("button", { name: "繼續使用", exact: true }).click();
    await expect(page).toHaveURL(/declined=1/);
    await expect(page.locator("main").getByRole("alert")).toBeVisible();
    const [declined] = await sql`select terms_version from users where email = ${email}`;
    expect(declined!.terms_version).toBeNull();
    const choice = page.getByRole("checkbox");
    await expect(choice).not.toBeChecked();
    await choice.check();
    await expect(choice).toBeChecked();
    await page.getByRole("button", { name: "繼續使用", exact: true }).click();
    await expect(page).toHaveURL(/\/library$/);
    const [accepted] =
      await sql`select terms_version, terms_accepted_at from users where email = ${email}`;
    expect(accepted!.terms_version).toBe(TERMS_VERSION);
    expect(accepted!.terms_accepted_at).toBeTruthy();
  } finally {
    await sql.end();
  }
});

test("opening an email link on another device requires a visible consent choice", async ({
  page,
  browser,
}) => {
  const email = uniqueEmail("terms-cross-device");
  await page.goto("/signin?callbackUrl=%2Flibrary");
  await page.getByLabel("電子郵件").fill(email);
  await page.getByRole("button", { name: "寄送登入連結" }).click();
  await expect(page).toHaveURL(/\/verify-request/);
  const context = await browser.newContext();
  try {
    const other = await context.newPage();
    await other.goto(await waitForMagicLink(page.request, email));
    await expect(other.getByRole("heading", { name: "確認使用條款" })).toBeVisible();
    await expect(other.getByRole("checkbox")).toBeChecked();
    await other.getByRole("button", { name: "繼續使用", exact: true }).click();
    await expect(other).toHaveURL(/\/library$/);
  } finally {
    await context.close();
  }
});
