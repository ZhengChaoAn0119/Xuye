import { expect, test, type Page } from "@playwright/test";
import { buildTestEpub } from "@/server/content/fixtures";
import { promoteToAdmin, signIn, uniqueEmail, uniqueTitle } from "./support";

/**
 * One public work per worker, seeded through the real admin paths:
 *   1 第1章 起點        story
 *   2 上架感言          author note
 *   3 番外：缺漏        placeholder body → hidden
 *   4 第2章 續行        story (latest visible)
 *   5 第3章 未來        added via admin, scheduled for 2099 → not public
 */
let work: { id: number; title: string };

async function seed(page: Page) {
  const email = uniqueEmail("e2e-seed");
  await signIn(page, email);
  await promoteToAdmin(email);
  const title = uniqueTitle("E2E 閱讀測試");
  const epub = buildTestEpub({
    title,
    chapters: [
      { title: "第1章 起點", lines: ["　　清晨的港口很安靜。", "第二段文字。"] },
      { title: "上架感言", lines: ["感謝各位讀者。"] },
      { title: "番外：缺漏", lines: ["出於版權保護，本章暫不支持網頁閱讀"] },
      { title: "第2章 續行", lines: ["故事繼續前進。"] },
    ],
  });
  const response = await page.request.post("/api/admin/import?apply=1", {
    multipart: {
      file: { name: "seed.epub", mimeType: "application/epub+zip", buffer: Buffer.from(epub) },
    },
  });
  expect(response.ok()).toBe(true);
  const { workId } = (await response.json()) as { workId: number };

  await page.goto(`/admin/works/${workId}/chapters/new`);
  await page.getByLabel("章節標題").fill("第3章 未來");
  await page.getByLabel("內文").fill("還不能讀的內容。");
  await page.getByLabel("排程發布").check();
  await page.getByLabel("發布時間（台北時間）").fill("2099-01-01T08:00");
  await page.getByRole("button", { name: "新增章節" }).click();
  await expect(page).toHaveURL(/#chapters$/);
  return { id: workId, title };
}

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext();
  work = await seed(await context.newPage());
  await context.close();
});

const noHorizontalOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

test("latest updates and search list the work", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "最新更新" })).toBeVisible();
  const card = page.getByRole("link", { name: new RegExp(work.title) }).first();
  await expect(card).toBeVisible();
  expect(await noHorizontalOverflow(page)).toBe(true);

  await page.getByRole("button", { name: "已完結" }).click();
  await expect(page.getByRole("link", { name: new RegExp(work.title) })).toHaveCount(0);
  await page.getByRole("button", { name: "連載中" }).click();
  await expect(page.getByRole("link", { name: new RegExp(work.title) }).first()).toBeVisible();

  await page.goto(`/search?q=${encodeURIComponent(work.title)}`);
  await expect(page.getByText(`「${work.title}」的搜尋結果`)).toBeVisible();
  await expect(page.getByText("1 部作品")).toBeVisible();
  await page.goto("/search?q=這個標題不存在的作品xyz");
  await expect(page.getByText("找不到符合的作品")).toBeVisible();
});

test("the work page shows only readable chapters", async ({ page }) => {
  await page.goto(`/works/${work.id}`);
  await expect(page.getByRole("heading", { level: 1, name: work.title })).toBeVisible();
  const directory = page.getByRole("region", { name: "章節目錄" });
  await expect(directory.getByRole("link")).toHaveCount(3);
  await expect(directory.getByRole("link", { name: "第1章 起點" })).toBeVisible();
  await expect(directory.getByRole("link", { name: /公告.*上架感言/ })).toBeVisible();
  await expect(directory.getByText("番外：缺漏")).toHaveCount(0);
  await expect(directory.getByText("第3章 未來")).toHaveCount(0);
  await expect(page.getByText("2 章", { exact: true })).toBeVisible(); // story chapters only
  expect(await noHorizontalOverflow(page)).toBe(true);

  await page.getByRole("link", { name: "開始閱讀" }).click();
  await expect(page).toHaveURL(new RegExp(`/works/${work.id}/chapters/1$`));
});

test("the reader navigates readable chapters and hides the rest", async ({ page }) => {
  await page.goto(`/works/${work.id}/chapters/1`);
  await expect(page.getByRole("heading", { level: 1, name: "第1章 起點" })).toBeVisible();
  await expect(page.getByText("清晨的港口很安靜。")).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  expect(await noHorizontalOverflow(page)).toBe(true);

  await page.getByRole("link", { name: "下一章 →" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "上架感言" })).toBeVisible();
  await expect(page.getByText("作者公告", { exact: true })).toBeVisible();

  // Skips the hidden chapter 3
  await page.getByRole("link", { name: "下一章 →" }).click();
  await expect(page).toHaveURL(new RegExp(`/chapters/4$`));
  await expect(page.getByText("已追到最新進度")).toBeVisible();

  // Keyboard navigation
  await page.keyboard.press("ArrowLeft");
  await expect(page).toHaveURL(new RegExp(`/chapters/2$`));

  for (const hiddenOrScheduled of [3, 5, 99]) {
    const response = await page.goto(`/works/${work.id}/chapters/${hiddenOrScheduled}`);
    await expect(page.getByRole("heading", { name: "找不到頁面" })).toBeVisible();
    expect(response?.status() === 404 || response?.status() === 200).toBe(true);
  }
});

test("reader font size and theme persist across chapters", async ({ page }) => {
  await page.goto(`/works/${work.id}/chapters/1`);
  const paragraph = page.getByText("清晨的港口很安靜。");
  const before = await paragraph.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));

  await page.getByRole("button", { name: "放大字級" }).click();
  await page.getByRole("button", { name: "放大字級" }).click();
  await page.getByRole("button", { name: "深色背景" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-reader-theme", "dark");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-reader-theme", "dark");
  const after = await page
    .getByText("清晨的港口很安靜。")
    .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(after).toBeGreaterThan(before);

  await page.getByRole("button", { name: "目錄" }).first().click();
  const toc = page.getByRole("navigation", { name: "目錄" });
  await expect(toc.getByRole("link", { name: "第1章 起點" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await toc.getByRole("link", { name: "第2章 續行" }).click();
  await expect(page).toHaveURL(new RegExp(`/chapters/4$`));
  await expect(page.locator("html")).toHaveAttribute("data-reader-theme", "dark");
});
