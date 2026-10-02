import { expect, test, type Page } from "@playwright/test";
import { buildTestEpub } from "@/server/content/fixtures";
import { promoteToAdmin, signIn, uniqueEmail, uniqueTitle } from "./support";

// This file exercises first-visit behavior, so readers start without any saved preferences.
test.use({ storageState: { cookies: [], origins: [] } });

let work: { id: number; title: string };
const CHAPTERS = 6;

// Long enough chapters that each one needs scrolling on desktop and mobile.
const lines = (chapter: number) =>
  Array.from({ length: 60 }, (_, i) => `第 ${chapter} 章的段落 ${i + 1}，連續閱讀測試內文。`);

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const email = uniqueEmail("reading-seed");
  await signIn(page, email);
  await promoteToAdmin(email);
  const title = uniqueTitle("E2E 連續閱讀");
  const response = await page.request.post("/api/admin/import?apply=1", {
    multipart: {
      file: {
        name: "reading.epub",
        mimeType: "application/epub+zip",
        buffer: Buffer.from(
          buildTestEpub({
            title,
            chapters: Array.from({ length: CHAPTERS }, (_, i) => ({
              title: `第 ${i + 1} 章`,
              lines: lines(i + 1),
            })),
          }),
        ),
      },
    },
  });
  expect(response.ok()).toBe(true);
  work = { id: ((await response.json()) as { workId: number }).workId, title };
  await context.close();
});

/** Reader input (a key press) followed by a jump to the very bottom, like dragging the scrollbar. */
async function readToTheEnd(page: Page) {
  await page.keyboard.press("PageDown");
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
}

function countChapterRequests(page: Page) {
  const urls: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes(`/api/v1/works/${work.id}/chapters/`)) urls.push(request.url());
  });
  return urls;
}

async function openChapterAndChoose(page: Page, mode: "翻頁閱讀" | "連續閱讀") {
  await page.goto(`/works/${work.id}/chapters/1`);
  const prompt = page.getByRole("dialog", { name: "選擇閱讀方式" });
  await expect(prompt).toBeVisible();
  await prompt.getByRole("button", { name: new RegExp(`^${mode}`) }).click();
  await expect(prompt).toBeHidden();
  await expect(page.getByText("第 1 章的段落 60，連續閱讀測試內文。")).toBeVisible();
}

test("paged reading keeps chapter buttons and never loads ahead", async ({ page }) => {
  const requests = countChapterRequests(page);
  await openChapterAndChoose(page, "翻頁閱讀");
  const end = page.getByRole("navigation", { name: "章節導覽" });
  await expect(end.getByRole("link", { name: /下一章/ })).toBeVisible();

  await readToTheEnd(page);
  await page.waitForTimeout(800);
  await expect(page.locator("[data-chapter-position]")).toHaveCount(1);
  expect(requests).toHaveLength(0);

  // The choice is remembered: no prompt on the next visit.
  await page.reload();
  await expect(page.getByText("第 1 章的段落 1，連續閱讀測試內文。")).toBeVisible();
  await expect(page.getByRole("dialog", { name: "選擇閱讀方式" })).toBeHidden();
});

test("the reader's top bar leads to the work directory and the chapter list", async ({ page }) => {
  await openChapterAndChoose(page, "翻頁閱讀");
  const topBar = page.locator("header").first();
  // The chapter opens with just its title: no repeated book link, reading time, or word count.
  await expect(page.locator("article header")).toHaveText("第 1 章");
  await expect(page.getByText(/分鐘・本章/)).toHaveCount(0);

  // The chapter title opens the in-reader table of contents.
  await topBar.getByRole("button", { name: "第 1 章" }).click();
  await expect(page.getByRole("navigation", { name: "目錄" })).toBeVisible();
  await page.getByRole("button", { name: "關閉目錄" }).click();

  // The book title goes to the work page's chapter directory.
  await topBar.getByRole("link", { name: work.title }).click();
  await expect(page).toHaveURL(new RegExp(`/works/${work.id}#directory$`));
  const heading = page.getByRole("heading", { name: "章節目錄" });
  await expect(heading).toBeInViewport();
  // Scrolled to the directory (just below the sticky header) — or as far as this short test page goes.
  await expect
    .poll(() =>
      page.evaluate(() => {
        const top = document.getElementById("directory-heading")!.getBoundingClientRect().top;
        const atBottom =
          window.scrollY >= document.documentElement.scrollHeight - window.innerHeight - 2;
        return top < 220 || (atBottom && window.scrollY > 0);
      }),
    )
    .toBe(true);
});

test("continuous reading appends chapters at the end and follows them", async ({ page }) => {
  const requests = countChapterRequests(page);
  await openChapterAndChoose(page, "連續閱讀");
  // Continuous reading has no previous/next buttons at the end of a chapter.
  await expect(
    page.getByRole("navigation", { name: "章節導覽" }).first().getByRole("link"),
  ).toHaveCount(0);
  await page.waitForTimeout(500);
  expect(requests).toHaveLength(0);

  await readToTheEnd(page);
  await expect(page.getByRole("heading", { level: 2, name: "第 2 章" })).toBeVisible();
  expect(requests).toHaveLength(1);

  await page
    .getByRole("heading", { level: 2, name: "第 2 章" })
    .evaluate((heading) =>
      window.scrollTo(0, heading.getBoundingClientRect().top + window.scrollY + 200),
    );
  await expect(page).toHaveURL(new RegExp(`/works/${work.id}/chapters/2$`));
  await expect(page).toHaveTitle(/^第 2 章｜/);
  await expect(page.locator("header").first()).toContainText("第 2 章");
});

test("far-away chapters drop their DOM and come back without a new request", async ({ page }) => {
  test.setTimeout(60_000);
  const requests = countChapterRequests(page);
  await openChapterAndChoose(page, "連續閱讀");
  for (let chapter = 2; chapter <= CHAPTERS; chapter++) {
    await readToTheEnd(page);
    await expect(page.getByRole("heading", { level: 2, name: `第 ${chapter} 章` })).toBeVisible();
  }
  await readToTheEnd(page);
  await expect(page.getByRole("heading", { name: "已追到最新進度" })).toBeVisible();
  expect(requests).toHaveLength(CHAPTERS - 1);

  // Back at the top, the latest chapters are far away: same height, no paragraphs.
  const last = page.locator(`[data-chapter-position="${CHAPTERS}"]`);
  const heightBefore = await last.evaluate((el) => el.getBoundingClientRect().height);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(last).not.toHaveAttribute("data-rendered", "1");
  await expect(last.locator("p")).toHaveCount(0);
  expect(await last.evaluate((el) => el.getBoundingClientRect().height)).toBeCloseTo(
    heightBefore,
    0,
  );

  // Scrolling back restores the text from page memory; nothing is fetched (no quota used).
  await last.evaluate((el) => el.scrollIntoView());
  await expect(page.getByText(`第 ${CHAPTERS} 章的段落 30，連續閱讀測試內文。`)).toBeVisible();
  expect(requests).toHaveLength(CHAPTERS - 1);
});

test("deciding later reads paged for now and the toolbar switches modes", async ({ page }) => {
  await page.goto(`/works/${work.id}/chapters/1`);
  const prompt = page.getByRole("dialog", { name: "選擇閱讀方式" });
  await prompt.getByRole("button", { name: /稍後再決定/ }).click();
  await expect(prompt).toBeHidden();
  await expect(page.getByRole("link", { name: /下一章/ })).toBeVisible();

  // Same browser session: not asked again.
  await page.reload();
  await expect(page.getByText("第 1 章的段落 1，連續閱讀測試內文。")).toBeVisible();
  await expect(prompt).toBeHidden();

  const toggle = page.getByRole("button", { name: "連續閱讀" });
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("link", { name: /下一章/ })).toHaveCount(0);
  await readToTheEnd(page);
  await expect(page.getByRole("heading", { level: 2, name: "第 2 章" })).toBeVisible();
});

test("visitors switch the theme and light/dark mode from the header", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-palette", "a3");
  await page.getByLabel("切換佈景主題").click();
  const palettes = page.getByRole("group", { name: "佈景主題" });
  await palettes.getByRole("button", { name: /追更/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-palette", "a2");

  const modes = page.getByRole("group", { name: "淺色或深色" });
  await modes.getByRole("button", { name: "深色" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-site-theme", "dark");
  const darkBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await modes.getByRole("button", { name: "淺色" }).click();
  const lightBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(darkBg).not.toBe(lightBg);

  // "Follow the system" tracks the device setting.
  await modes.getByRole("button", { name: "跟隨系統" }).click();
  await page.emulateMedia({ colorScheme: "dark" });
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(darkBg);
  await page.emulateMedia({ colorScheme: "light" });
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(lightBg);

  await page.keyboard.press("Escape");
  await page.goto("/search");
  await expect(page.locator("html")).toHaveAttribute("data-palette", "a2");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test("visitors use device settings; account sections ask them to sign in", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.getByRole("heading", { level: 1, name: "設定" })).toBeVisible();
  await page.getByRole("link", { name: /外觀/ }).first().click();
  await expect(page).toHaveURL(/\/settings\/appearance$/);
  await expect(page.getByText(/設定只會保存在這台裝置/)).toBeVisible();
  await page
    .getByRole("group", { name: "作品列表顯示" })
    .getByRole("button", { name: "欄位列表" })
    .click();
  await page
    .getByRole("group", { name: "章節目錄排序" })
    .getByRole("button", { name: "由新到舊" })
    .click();

  // The browsing choices apply where lists are shown.
  await page.goto(`/works/${work.id}`);
  await expect(page.getByRole("button", { name: /由新到舊/ })).toBeVisible();
  const firstEntry = page
    .locator('a[href*="/chapters/"]')
    .filter({ hasText: /第 \d 章/ })
    .first();
  await expect(firstEntry).toContainText(`第 ${CHAPTERS} 章`);

  await page.goto("/settings/content");
  await expect(page.getByText("這個分類需要登入後才能設定。")).toBeVisible();
});

test("members manage settings, cannot rename on Free, export data, and delete the account", async ({
  page,
}) => {
  const email = uniqueEmail("settings-member");
  await signIn(page, email);

  await page.goto("/settings/appearance");
  await page.getByRole("button", { name: "紙頁" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-palette", "a1");
  await expect(page.getByText("已儲存", { exact: true })).toBeVisible();
  await page.getByLabel("切換佈景主題").click();
  await expect(
    page
      .getByRole("banner")
      .getByRole("group", { name: "佈景主題" })
      .getByRole("button", { name: /紙頁/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Escape");

  await page.goto("/settings/profile");
  await expect(page.getByRole("textbox", { name: "顯示名稱" })).toBeDisabled();
  await expect(page.getByText(/付費會員功能/)).toBeVisible();
  const rename = await page.request.put("/api/v1/me/profile", { data: { name: "新名字" } });
  expect(rename.status()).toBe(403);

  await page.goto("/settings/privacy");
  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "下載" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^xuye-account-.*\.json$/);

  await page.getByRole("button", { name: "刪除帳號…" }).click();
  await page.getByLabel(/請輸入你的電子郵件/).fill("wrong@xuye.localhost");
  await page.getByRole("button", { name: "永久刪除" }).click();
  await expect(page.getByText("電子郵件不相符，帳號未刪除。")).toBeVisible();
  await page.getByLabel(/請輸入你的電子郵件/).fill(email);
  await page.getByRole("button", { name: "永久刪除" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/account");
  await expect(page).toHaveURL(/\/signin/);
});

test("admins cannot delete their own account from settings", async ({ page }) => {
  const email = uniqueEmail("settings-admin");
  await signIn(page, email);
  await promoteToAdmin(email);
  await page.goto("/settings/privacy");
  await expect(page.getByRole("button", { name: "刪除帳號…" })).toBeDisabled();
  const response = await page.request.delete("/api/v1/me", { data: { confirmEmail: email } });
  expect(response.status()).toBe(403);
});
