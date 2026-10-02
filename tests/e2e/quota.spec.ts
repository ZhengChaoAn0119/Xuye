import { expect, test, type Page } from "@playwright/test";
import { buildTestEpub } from "@/server/content/fixtures";
import { promoteToAdmin, signIn, uniqueEmail, uniqueTitle } from "./support";

let work: { id: number; title: string };

async function seed(page: Page) {
  const email = uniqueEmail("quota-seed");
  await signIn(page, email);
  await promoteToAdmin(email);
  const title = uniqueTitle("E2E 額度測試");
  const chapters = Array.from({ length: 12 }, (_, index) => ({
    title: index === 10 ? "上架感言" : `第 ${index + 1} 章`,
    lines: [index === 10 ? "這是免費的作者公告。" : `額度測試內文 ${index + 1}。`],
  }));
  const response = await page.request.post("/api/admin/import?apply=1", {
    multipart: {
      file: {
        name: "quota.epub",
        mimeType: "application/epub+zip",
        buffer: Buffer.from(buildTestEpub({ title, chapters })),
      },
    },
  });
  expect(response.ok()).toBe(true);
  return { id: ((await response.json()) as { workId: number }).workId, title };
}

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext();
  work = await seed(await context.newPage());
  await context.close();
});

test("a visitor receives 10 story chapters per rolling 24 hours; rereads and notes are free", async ({
  page,
}) => {
  for (let position = 1; position <= 10; position++) {
    await page.goto(`/works/${work.id}/chapters/${position}`);
    await expect(page.getByText(`額度測試內文 ${position}。`)).toBeVisible();
  }

  // Rereading a charged chapter does not consume another unit.
  await page.goto(`/works/${work.id}/chapters/10`);
  await expect(page.getByText("額度測試內文 10。")).toBeVisible();

  // The author note is rate-limited but never quota-charged.
  await page.goto(`/works/${work.id}/chapters/11`);
  await expect(page.getByText("這是免費的作者公告。")).toBeVisible();

  await page.goto(`/works/${work.id}/chapters/12`);
  await expect(page.getByRole("heading", { name: "本次閱讀額度已用完" })).toBeVisible();
  await expect(page.getByText("額度測試內文 12。")).toHaveCount(0);
  await expect(page.getByText(/閱讀完畢/)).toHaveCount(0);
  await expect(page.getByRole("link", { name: /下一章/ })).toHaveCount(0);

  const visitorCookie = (await page.context().cookies()).find(
    (cookie) => cookie.name === "xuye_visitor",
  );
  expect(visitorCookie?.httpOnly).toBe(true);
  expect(visitorCookie?.sameSite).toBe("Lax");
});

test("Free accounts show the 50 chapter allowance on the account page", async ({ page }) => {
  await signIn(page, uniqueEmail("quota-free"));
  await page.goto("/account");
  await expect(page.getByRole("heading", { name: "閱讀額度" })).toBeVisible();
  await expect(page.getByText("本期尚可閱讀 50／50 章")).toBeVisible();
  await expect(page.getByText("尚未開始本期 24 小時閱讀額度。")).toBeVisible();
});

test("admins can review and save quota settings", async ({ page }) => {
  const email = uniqueEmail("quota-admin");
  await signIn(page, email);
  await promoteToAdmin(email);
  await page.goto("/admin/quota");
  await expect(page.getByRole("heading", { level: 1, name: "閱讀額度" })).toBeVisible();
  await expect(page.getByLabel("訪客章數／24 小時")).toHaveValue("10");
  await expect(page.getByLabel("免費會員章數／24 小時")).toHaveValue("50");
  await page.getByRole("button", { name: "儲存額度設定" }).click();
  await expect(page.getByText("已儲存閱讀額度設定")).toBeVisible();
});

test("the privacy policy discloses hashed visitor signals", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { level: 1, name: "隱私權政策" })).toBeVisible();
  await expect(page.getByText(/資料庫不保存原始 IP 或原始特徵值/)).toBeVisible();
  await expect(page.getByText(/滾動 24 小時閱讀額度/)).toBeVisible();
});
