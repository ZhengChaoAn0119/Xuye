import { expect, test } from "@playwright/test";
import { buildTestEpub } from "@/server/content/fixtures";
import { promoteToAdmin, signIn, uniqueEmail, uniqueTitle } from "./support";

async function seedWork(page: import("@playwright/test").Page) {
  const email = uniqueEmail("navigation-seed");
  await signIn(page, email);
  await promoteToAdmin(email);
  const title = uniqueTitle("E2E 導覽作品");
  const response = await page.request.post("/api/admin/import?apply=1", {
    multipart: {
      file: {
        name: "navigation.epub",
        mimeType: "application/epub+zip",
        buffer: Buffer.from(
          buildTestEpub({
            title,
            chapters: [
              { title: "第1章 導覽起點", lines: ["用來驗證導覽與收藏的內容。"] },
              { title: "第2章 下一站", lines: ["第二章內容。"] },
            ],
          }),
        ),
      },
    },
  });
  expect(response.ok()).toBe(true);
  return { id: ((await response.json()) as { workId: number }).workId, title };
}

let work: { id: number; title: string };

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext();
  work = await seedWork(await context.newPage());
  await context.close();
});

test("visitor can traverse public pages and recover from protected and email-check routes", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("searchbox", { name: "搜尋" }).fill("導覽");
  await page.getByRole("button", { name: "搜尋" }).click();
  await expect(page).toHaveURL(/\/search\?q=/);
  await page.getByRole("link", { name: "書架" }).click();
  await expect(page).toHaveURL(/\/signin\?callbackUrl=%2Flibrary/);

  await page.goto("/verify-request");
  await page.getByRole("link", { name: "使用其他電子郵件" }).click();
  await expect(page).toHaveURL(/\/signin$/);
  await page.goto("/verify-request");
  await page.getByRole("link", { name: "回到首頁" }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/signin/);
});

test("reader can enter every account area, leave it, and is denied admin navigation", async ({
  page,
}) => {
  await signIn(page, uniqueEmail("navigation-reader"));
  await page.goto("/account");
  await page.getByRole("main").getByRole("link", { name: "書架" }).click();
  await expect(page).toHaveURL(/\/library$/);
  await page.getByRole("link", { name: "紀錄" }).click();
  await expect(page).toHaveURL(/\/history$/);

  await page.locator('summary[aria-label="開啟帳號選單"]').click();
  await expect(page.getByRole("link", { name: "後台", exact: true })).toHaveCount(0);
  await page.getByRole("heading", { name: "還沒有閱讀紀錄", exact: true }).click();
  await expect(
    page.locator("details").filter({ has: page.locator('summary[aria-label="開啟帳號選單"]') }),
  ).not.toHaveAttribute("open", "");
  // The account menu holds the broad, frequent destinations; details live under 設定.
  for (const [name, path] of [
    ["內容偏好", /\/settings\/content$/],
    ["設定", /\/settings$/],
    ["個人資訊", /\/account$/],
  ] as const) {
    await page.locator('summary[aria-label="開啟帳號選單"]').click();
    await page.getByRole("banner").getByRole("link", { name, exact: true }).click();
    await expect(page).toHaveURL(path);
    // Following a link closes the menu even though the header persists across navigations.
    await expect(
      page.locator("details").filter({ has: page.locator('summary[aria-label="開啟帳號選單"]') }),
    ).not.toHaveAttribute("open", "");
  }
  await page.getByRole("link", { name: "最新" }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "找不到頁面" })).toBeVisible();
});

test("reader can remove and undo bookshelf and history entries", async ({ page }) => {
  await signIn(page, uniqueEmail("navigation-collections"));
  await page.goto(`/works/${work.id}`);
  await page.getByRole("button", { name: /收藏作品/ }).click();
  const progressSaved = page.waitForResponse(
    (response) => response.url().endsWith("/api/v1/me/progress") && response.ok(),
  );
  await page.goto(`/works/${work.id}/chapters/1`);
  await progressSaved;

  await page.goto("/library");
  await page.getByRole("button", { name: "移出書架" }).click();
  await expect(page.getByText("已從書架移除。")).toBeVisible();
  await page.getByRole("button", { name: "復原" }).click();
  await expect(page.getByRole("heading", { name: work.title })).toBeVisible();

  await page.goto("/history");
  await page.getByRole("button", { name: "移除", exact: true }).click();
  await expect(page.getByText("已移除這筆閱讀紀錄。")).toBeVisible();
  await page.getByRole("button", { name: "復原" }).click();
  await expect(page.getByRole("heading", { name: work.title })).toBeVisible();

  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain("清除全部閱讀紀錄");
    await dialog.accept();
  });
  await page.getByRole("button", { name: "清除全部" }).click();
  await expect(page.getByText("已清除全部閱讀紀錄。")).toBeVisible();
  await page.getByRole("button", { name: "復原" }).click();
  await expect(page.getByRole("heading", { name: work.title })).toBeVisible();
});

test("admin can traverse back office, preview the site, protect edits, and sign out", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const email = uniqueEmail("navigation-admin");
  await signIn(page, email);
  await promoteToAdmin(email);

  await page.goto("/admin");
  let adminNav = page.getByRole("navigation", { name: "管理後台導覽" });
  await expect(adminNav.getByRole("link", { name: "總覽" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  for (const [name, path] of [
    ["作品", "/admin/works"],
    ["匯入 EPUB", "/admin/import"],
    ["閱讀額度", "/admin/quota"],
  ] as const) {
    await adminNav.getByRole("link", { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    adminNav = page.getByRole("navigation", { name: "管理後台導覽" });
    await expect(adminNav.getByRole("link", { name, exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
  }

  await page.goto(`/admin/works/${work.id}`);
  await page.getByLabel("作者").fill("尚未儲存的作者");
  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain("尚有未儲存的變更");
    await dialog.dismiss();
  });
  await page.getByRole("link", { name: "取消" }).click();
  await expect(page).toHaveURL(new RegExp(`/admin/works/${work.id}$`));

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("link", { name: "預覽公開頁面" }).click();
  await expect(page).toHaveURL(new RegExp(`/works/${work.id}$`));
  await page.locator('summary[aria-label="開啟帳號選單"]').click();
  await page.getByRole("link", { name: "後台", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.getByRole("link", { name: "查看網站" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/admin");
  await page.getByRole("button", { name: "登出" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: "登入" })).toBeVisible();
});
