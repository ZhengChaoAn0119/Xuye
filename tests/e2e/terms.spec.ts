import { expect, test, type Page } from "@playwright/test";
import postgres from "postgres";
import { TERMS_VERSION } from "@/lib/terms";
import { e2eDatabaseUrl } from "./env";
import { promoteToAdmin, signIn, uniqueEmail, waitForMagicLink } from "./support";

const notice = (page: Page) => page.getByRole("region", { name: "隱私與條款通知" });

async function termsOf(email: string) {
  const sql = postgres(e2eDatabaseUrl(), { max: 1 });
  try {
    const [user] =
      await sql`select terms_version, terms_accepted_at from users where email = ${email}`;
    return user!;
  } finally {
    await sql.end();
  }
}

/** A signed-in account whose agreement predates the current terms version. */
async function signInPending(page: Page, label: string) {
  const email = uniqueEmail(label);
  await signIn(page, email);
  const sql = postgres(e2eDatabaseUrl(), { max: 1 });
  try {
    await sql`update users set terms_version = null, terms_accepted_at = null where email = ${email}`;
  } finally {
    await sql.end();
  }
  return email;
}

test("terms are accessible and sign-in states agreement without a checkbox", async ({
  page,
}, testInfo) => {
  await page.goto("/terms");
  await expect(page.getByRole("heading", { name: "服務條款", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "七、帳號刪除" })).toBeVisible();
  await expect(page.getByText(`版本與更新日期：${TERMS_VERSION}`)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("terms.png"), fullPage: true });

  await page.goto("/signin");
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await expect(page.getByText("繼續即表示你同意")).toBeVisible();
  await expect(page.locator("main").getByRole("link", { name: "服務條款" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("signin.png"), fullPage: true });
});

test.describe("visitor privacy notice", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("is shown once with the privacy policy link and only an acknowledgement", async ({
    page,
  }, testInfo) => {
    await page.goto("/");
    await expect(notice(page)).toBeVisible();
    await expect(notice(page).getByRole("link", { name: "隱私權政策" })).toBeVisible();
    await expect(notice(page).getByRole("button")).toHaveText(["知道了"]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: testInfo.outputPath("visitor-notice.png") });
    await notice(page).getByRole("button", { name: "知道了" }).click();
    await expect(notice(page)).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole("heading", { name: "最新更新" })).toBeVisible();
    await expect(notice(page)).toHaveCount(0);
  });

  test("closes and stays closed after a click elsewhere on the page", async ({ page }) => {
    await page.goto("/");
    await expect(notice(page)).toBeVisible();
    await page.getByRole("heading", { name: "最新更新" }).click();
    await expect(notice(page)).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole("heading", { name: "最新更新" })).toBeVisible();
    await expect(notice(page)).toHaveCount(0);
  });
});

test("default agreement is recorded at sign-in and admin identity and mark are accurate", async ({
  page,
}, testInfo) => {
  const email = uniqueEmail("terms-admin");
  await signIn(page, email);
  const user = await termsOf(email);
  expect(user.terms_version).toBe(TERMS_VERSION);
  expect(user.terms_accepted_at).toBeTruthy();
  await page.goto("/account");
  await expect(page.locator("main").getByText("免費會員", { exact: true })).toBeVisible();
  await expect(notice(page)).toHaveCount(0);
  await promoteToAdmin(email);
  await page.reload();
  await expect(page.locator("main").getByText("管理員", { exact: true })).toBeVisible();
  await expect(page.locator("main").getByText("免費會員", { exact: true })).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("account-admin.png"), fullPage: true });
  await page.goto("/admin");
  await expect(page.getByRole("link", { name: "管理後台", exact: true })).toContainText("續");
  await page.screenshot({ path: testInfo.outputPath("admin.png"), fullPage: true });
});

test("a pending account keeps working and accepting records the current version", async ({
  page,
}, testInfo) => {
  const email = await signInPending(page, "terms-accept");
  await page.goto("/library");
  await expect(page).toHaveURL(/\/library$/);
  await expect(page.getByRole("heading", { name: "我的書架" })).toBeVisible();
  await expect(notice(page)).toContainText("請確認服務條款");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("terms-notice.png") });
  const response = await page.request.put("/api/v1/me/preferences", {
    data: { siteTheme: "dark" },
  });
  expect(response.ok()).toBe(true);
  expect((await termsOf(email)).terms_version).toBeNull();

  await notice(page).getByRole("button", { name: "接受" }).click();
  await expect(notice(page)).toHaveCount(0);
  await expect.poll(async () => (await termsOf(email)).terms_version).toBe(TERMS_VERSION);
  expect((await termsOf(email)).terms_accepted_at).toBeTruthy();
  await page.reload();
  await expect(page.getByRole("heading", { name: "我的書架" })).toBeVisible();
  await expect(notice(page)).toHaveCount(0);
});

test("continuing to another page without choosing records agreement", async ({ page }) => {
  const email = await signInPending(page, "terms-continue");
  await page.goto("/");
  await expect(notice(page)).toBeVisible();
  // Reading the policies is not continued use.
  await notice(page).getByRole("link", { name: "服務條款" }).click();
  await expect(page).toHaveURL(/\/terms$/);
  await expect(notice(page)).toBeVisible();
  expect((await termsOf(email)).terms_version).toBeNull();

  await page.getByRole("link", { name: "書架" }).first().click();
  await expect(page).toHaveURL(/\/library$/);
  await expect.poll(async () => (await termsOf(email)).terms_version).toBe(TERMS_VERSION);
  await expect(notice(page)).toHaveCount(0);
});

test("a click elsewhere closes the notice and records agreement", async ({ page }) => {
  const email = await signInPending(page, "terms-click");
  await page.goto("/library");
  await expect(notice(page)).toBeVisible();
  await page.getByRole("heading", { name: "我的書架" }).click();
  await expect(notice(page)).toHaveCount(0);
  await expect.poll(async () => (await termsOf(email)).terms_version).toBe(TERMS_VERSION);
});

test("scrolling or a key press records agreement; moving focus does not", async ({ page }) => {
  const scroller = await signInPending(page, "terms-wheel");
  await page.goto("/");
  await expect(notice(page)).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(notice(page)).toBeVisible();
  await page.mouse.move(200, 200);
  await page.mouse.wheel(0, 400);
  await expect(notice(page)).toHaveCount(0);
  await expect.poll(async () => (await termsOf(scroller)).terms_version).toBe(TERMS_VERSION);

  await page.context().clearCookies();
  const typist = await signInPending(page, "terms-key");
  await page.goto("/");
  await expect(notice(page)).toBeVisible();
  await page.keyboard.press("End");
  await expect(notice(page)).toHaveCount(0);
  await expect.poll(async () => (await termsOf(typist)).terms_version).toBe(TERMS_VERSION);
});

test("clicks elsewhere on the decline step are not agreement", async ({ page }) => {
  const email = await signInPending(page, "terms-decline-click");
  await page.goto("/library");
  await notice(page).getByRole("button", { name: "拒絕" }).click();
  await page.getByRole("heading", { name: "我的書架" }).click();
  await expect(notice(page)).toContainText("拒絕後將登出");
  await notice(page).getByRole("button", { name: "返回" }).click();
  await expect(notice(page)).toContainText("請確認服務條款");
  expect((await termsOf(email)).terms_version).toBeNull();
});

test("a later visit after seeing the notice records agreement", async ({ page }) => {
  const email = await signInPending(page, "terms-revisit");
  await page.goto("/");
  await expect(notice(page)).toBeVisible();
  expect((await termsOf(email)).terms_version).toBeNull();
  await page.reload();
  await expect.poll(async () => (await termsOf(email)).terms_version).toBe(TERMS_VERSION);
});

test("declining offers data rights first, then signs out without recording agreement", async ({
  page,
}, testInfo) => {
  const email = await signInPending(page, "terms-decline");
  await page.goto("/");
  await notice(page).getByRole("button", { name: "拒絕" }).click();
  await expect(notice(page)).toContainText("拒絕後將登出");
  await expect(notice(page).getByRole("link", { name: "下載我的資料" })).toHaveAttribute(
    "href",
    "/api/v1/me/export",
  );
  await page.screenshot({ path: testInfo.outputPath("terms-decline.png") });

  // Visiting the deletion settings while deciding is not continued use.
  await notice(page).getByRole("link", { name: "前往刪除帳號" }).click();
  await expect(page).toHaveURL(/\/settings\/privacy$/);
  await expect(notice(page)).toContainText("拒絕後將登出");
  expect((await termsOf(email)).terms_version).toBeNull();

  await notice(page).getByRole("button", { name: "確認拒絕並登出" }).click();
  await expect.poll(async () => (await page.request.get("/api/auth/session")).json()).toBeNull();
  expect((await termsOf(email)).terms_version).toBeNull();
});

test("opening an email link on another device shows the terms notice", async ({
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
    await expect(other).toHaveURL(/\/library$/);
    await expect(notice(other)).toContainText("請確認服務條款");
    expect((await termsOf(email)).terms_version).toBeNull();
    await notice(other).getByRole("button", { name: "接受" }).click();
    await expect.poll(async () => (await termsOf(email)).terms_version).toBe(TERMS_VERSION);
  } finally {
    await context.close();
  }
});
