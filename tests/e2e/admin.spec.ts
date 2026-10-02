import { expect, test } from "@playwright/test";
import { buildTestEpub } from "@/server/content/fixtures";
import { promoteToAdmin, signIn, uniqueEmail } from "./support";

const fixtureEpub = (title: string) => ({
  name: "fixture.epub",
  mimeType: "application/epub+zip",
  buffer: Buffer.from(
    buildTestEpub({
      title,
      chapters: [
        { title: "第1章 起點", lines: ["　　第一段。", "第二段。"] },
        { title: "上架感言", lines: ["感謝支持。"] },
        { title: "第2章 續行", lines: ["第三段。"] },
      ],
    }),
  ),
});

test("signed-out visitors are sent to sign-in and readers get a 404", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/signin/);

  // Streaming may already have sent a 200, so assert on content: the not-found UI
  // renders and no admin content reaches the browser.
  await signIn(page, uniqueEmail("e2e-reader"));
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "找不到頁面" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "總覽" })).toHaveCount(0);
  expect(await page.content()).not.toContain("即將發布");
});

test("the import API rejects anonymous uploads", async ({ request }) => {
  const response = await request.post("/api/admin/import", {
    multipart: { file: fixtureEpub("x") },
  });
  expect(response.status()).toBe(401);
});

test("an admin imports an EPUB, edits the work, and schedules a chapter", async ({ page }) => {
  const email = uniqueEmail("e2e-admin");
  await signIn(page, email);
  await promoteToAdmin(email);
  const title = `E2E 測試之書 ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  // Preview, then import
  await page.goto("/admin/import");
  await page.getByLabel("EPUB 檔案").setInputFiles(fixtureEpub(title));
  await page.getByRole("button", { name: "預覽" }).click();
  await expect(page.getByText(`新增作品「${title}」`)).toBeVisible();
  await expect(page.getByText("新增 3 章")).toBeVisible();
  await expect(page.getByText("判定為作者公告：#2 上架感言")).toBeVisible();
  await page.getByRole("button", { name: /確認匯入/ }).click();
  await expect(page.getByRole("heading", { name: "匯入完成" })).toBeVisible();
  await page.getByRole("link", { name: "前往作品" }).click();
  await expect(page).toHaveURL(/\/admin\/works\/\d+$/);
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();

  // Edit work metadata
  await page.getByLabel("作者").fill("E2E 作者");
  await page.getByLabel("分類標籤").fill("測試、同人");
  await page.getByRole("button", { name: "儲存作品資料" }).click();
  await expect(page.getByText("已儲存作品資料")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("作者")).toHaveValue("E2E 作者");
  await expect(page.getByLabel("分類標籤")).toHaveValue("同人、測試");

  // Schedule a new chapter for the future
  await page.getByRole("link", { name: "新增章節" }).click();
  await page.getByLabel("章節標題").fill("第3章 排程中的新章");
  await page.getByLabel("內文").fill("排程內容第一段。\n排程內容第二段。");
  await page.getByLabel("排程發布").check();
  await page.getByLabel("發布時間（台北時間）").fill("2099-01-01T08:00");
  await page.getByRole("button", { name: "新增章節" }).click();
  await expect(page).toHaveURL(/\/admin\/works\/\d+#chapters$/);
  const row = page.getByRole("row").filter({ hasText: "第3章 排程中的新章" });
  await expect(row.getByText("排程", { exact: true })).toBeVisible();
  await expect(row.getByText("2099/01/01 08:00")).toBeVisible();

  // Dashboard renders its stats (streamed content: a 200 status alone proves nothing)
  await page.goto("/admin");
  await expect(page.getByRole("heading", { level: 1, name: "總覽" })).toBeVisible();
  await expect(page.getByLabel("統計").getByText("排程中")).toBeVisible();
  await expect(page.getByRole("heading", { name: "即將發布" })).toBeVisible();
  await expect(page.getByRole("link", { name: "第3章 排程中的新章" }).first()).toBeVisible();

  // Re-importing the same file changes nothing
  await page.goto("/admin/import");
  await page.getByLabel("EPUB 檔案").setInputFiles(fixtureEpub(title));
  await page.getByRole("button", { name: "預覽" }).click();
  await expect(page.getByText("沒有需要匯入的變更。")).toBeVisible();
});
