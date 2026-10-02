import { expect, test, type Page } from "@playwright/test";
import { buildTestEpub } from "@/server/content/fixtures";
import { promoteToAdmin, signIn, uniqueEmail, uniqueTitle } from "./support";

let work: { id: number; title: string };

const expectNoHorizontalOverflow = async (page: Page) => {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
};

async function seed(page: Page) {
  const adminEmail = uniqueEmail("e2e-account-seed");
  await signIn(page, adminEmail);
  await promoteToAdmin(adminEmail);
  const title = uniqueTitle("E2E 帳號同步");
  const response = await page.request.post("/api/admin/import?apply=1", {
    multipart: {
      file: {
        name: "account.epub",
        mimeType: "application/epub+zip",
        buffer: Buffer.from(
          buildTestEpub({
            title,
            chapters: [
              { title: "第1章 同步起點", lines: ["用來驗證閱讀進度的第一段。", "第二段。"] },
              { title: "第2章 跨裝置", lines: ["跨裝置閱讀內容。"] },
            ],
          }),
        ),
      },
    },
  });
  expect(response.ok()).toBe(true);
  const { workId } = (await response.json()) as { workId: number };
  return { id: workId, title };
}

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext();
  work = await seed(await context.newPage());
  await context.close();
});

test("account, bookshelf, progress, history, bookmarks, and preferences synchronize", async ({
  page,
  browser,
}) => {
  await page.goto("/library");
  await expect(page).toHaveURL(/\/signin\?callbackUrl=/);

  const email = uniqueEmail("e2e-phase3-reader");
  await signIn(page, email);

  await page.goto(`/works/${work.id}`);
  await expectNoHorizontalOverflow(page);
  await page.getByRole("button", { name: /收藏作品/ }).click();
  await expect(page.getByRole("button", { name: /已收藏/ })).toBeVisible();

  const progressSaved = page.waitForResponse(
    (response) => response.url().endsWith("/api/v1/me/progress") && response.ok(),
  );
  await page.goto(`/works/${work.id}/chapters/1`);
  await progressSaved;
  await expect(page.getByText("用來驗證閱讀進度的第一段。")).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByRole("button", { name: "加入書籤" }).click();
  await expect(page.getByRole("button", { name: "移除書籤" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "移除書籤" })).toBeVisible();

  await page.goto("/library");
  await expect(page.getByRole("heading", { name: work.title })).toBeVisible();
  await expect(page.getByRole("link", { name: /繼續閱讀・第 1 章/ })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto("/history");
  await expect(page.getByRole("heading", { name: work.title })).toBeVisible();
  await expect(page.getByText("讀至第 1 章", { exact: false })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto("/account");
  await expect(page.getByRole("heading", { level: 1, name: "我的" })).toBeVisible();
  // The heading is a display name derived from the email, never the full address.
  await expect(
    page.getByRole("heading", { level: 2, name: email.slice(0, 4) + "…" }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto("/settings/reading");
  await page.getByRole("group", { name: "閱讀背景" }).getByRole("button", { name: "深色" }).click();
  await expect(page.getByText("已儲存", { exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.goto("/settings/appearance");
  await page.getByRole("button", { name: "紙頁" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-palette", "a1");
  await expect(page.getByText("已儲存", { exact: true })).toBeVisible();

  const secondContext = await browser.newContext();
  const secondPage = await secondContext.newPage();
  await signIn(secondPage, email);
  await secondPage.goto(`/works/${work.id}/chapters/1`);
  await expect(secondPage.locator("html")).toHaveAttribute("data-reader-theme", "dark");
  await expect(secondPage.locator("html")).toHaveAttribute("data-palette", "a1");
  await expect(secondPage.getByRole("button", { name: "移除書籤" })).toBeVisible();
  await secondContext.close();
});
