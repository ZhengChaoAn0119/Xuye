import { expect, test, type Page } from "@playwright/test";
import { buildTestEpub } from "@/server/content/fixtures";
import { promoteToAdmin, signIn, uniqueEmail, uniqueTitle } from "./support";

let work: { id: number; title: string };

// Long enough chapters that each one needs scrolling on desktop and mobile.
const lines = (chapter: number) =>
  Array.from({ length: 60 }, (_, i) => `第 ${chapter} 章的段落 ${i + 1}，連續閱讀測試內文。`);

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const email = uniqueEmail("auto-next-seed");
  await signIn(page, email);
  await promoteToAdmin(email);
  const title = uniqueTitle("E2E 連續閱讀");
  const response = await page.request.post("/api/admin/import?apply=1", {
    multipart: {
      file: {
        name: "auto-next.epub",
        mimeType: "application/epub+zip",
        buffer: Buffer.from(
          buildTestEpub({
            title,
            chapters: [1, 2, 3].map((n) => ({ title: `第 ${n} 章`, lines: lines(n) })),
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

test("the next chapter loads only after the reader reaches the end", async ({ page }) => {
  const chapterRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes(`/api/v1/works/${work.id}/chapters/`))
      chapterRequests.push(request.url());
  });

  await page.goto(`/works/${work.id}/chapters/1`);
  await expect(page.getByText("第 1 章的段落 60，連續閱讀測試內文。")).toBeVisible();
  await page.waitForTimeout(500);
  // Opening a chapter never fetches the next one ahead of time.
  expect(chapterRequests).toHaveLength(0);
  await expect(page.locator("[data-chapter-position]")).toHaveCount(1);

  await readToTheEnd(page);
  await expect(page.getByRole("heading", { level: 2, name: "第 2 章" })).toBeVisible();
  await expect(page.locator("[data-chapter-position]")).toHaveCount(2);
  expect(chapterRequests).toHaveLength(1);

  // Scrolling into the appended chapter moves the URL, title, and top bar along.
  await page
    .getByRole("heading", { level: 2, name: "第 2 章" })
    .evaluate((heading) =>
      window.scrollTo(0, heading.getBoundingClientRect().top + window.scrollY + 200),
    );
  await expect(page).toHaveURL(new RegExp(`/works/${work.id}/chapters/2$`));
  await expect(page).toHaveTitle(/^第 2 章｜/);
  await expect(page.locator("header").first()).toContainText("第 2 章");

  // The last chapter ends the stream with the caught-up state.
  await readToTheEnd(page);
  await expect(page.getByRole("heading", { level: 2, name: "第 3 章" })).toBeVisible();
  await readToTheEnd(page);
  await expect(page.getByRole("heading", { name: "已追到最新進度" })).toBeVisible();
  expect(chapterRequests).toHaveLength(2);
});

test("readers can turn auto-loading off from the reader toolbar", async ({ page }) => {
  await page.goto(`/works/${work.id}/chapters/1`);
  await expect(page.getByText("第 1 章的段落 60，連續閱讀測試內文。")).toBeVisible();
  const toggle = page.getByRole("button", { name: "自動載入下一章" });
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");

  await readToTheEnd(page);
  await page.waitForTimeout(800);
  await expect(page.locator("[data-chapter-position]")).toHaveCount(1);
  await expect(page.getByRole("link", { name: /下一章/ })).toBeVisible();

  // The choice persists on this device.
  await page.reload();
  await expect(page.getByRole("button", { name: "自動載入下一章" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});

test("visitors can switch the site theme from the header", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-palette", "a3");
  await page.getByLabel("切換佈景主題").click();
  const options = page.getByRole("group", { name: "佈景主題" });
  await expect(options.getByRole("button", { name: /現代/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await options.getByRole("button", { name: /追更/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-palette", "a2");
  await expect(options.getByRole("button", { name: /追更/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  // Escape closes the picker; the palette survives navigation and reload before paint.
  await page.keyboard.press("Escape");
  await expect(options).toBeHidden();
  await page.goto("/search");
  await expect(page.locator("html")).toHaveAttribute("data-palette", "a2");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test("signed-in readers keep the header theme choice on the account page", async ({ page }) => {
  await signIn(page, uniqueEmail("theme-sync"));
  await page.goto("/account");
  await page.getByLabel("切換佈景主題").click();
  await page.getByRole("group", { name: "佈景主題" }).getByRole("button", { name: /紙頁/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-palette", "a1");
  await expect(page.getByRole("button", { name: "紙頁", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect
    .poll(async () => {
      const response = await page.request.get("/api/v1/me/preferences");
      return ((await response.json()) as { preferences: { sitePalette: string } }).preferences
        .sitePalette;
    })
    .toBe("a1");
});
