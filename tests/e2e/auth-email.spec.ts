import { expect, test, type APIRequestContext } from "@playwright/test";

// Mailpit catches outgoing mail locally (docker compose) and in CI (service container).
const MAILPIT = process.env.MAILPIT_URL ?? "http://localhost:8025";

async function waitForMagicLink(request: APIRequestContext, email: string): Promise<string> {
  for (let attempt = 0; attempt < 30; attempt++) {
    const search = await request.get(`${MAILPIT}/api/v1/search`, {
      params: { query: `to:"${email}"` },
    });
    const { messages } = (await search.json()) as { messages: { ID: string }[] };
    if (messages.length > 0) {
      const message = await request.get(`${MAILPIT}/api/v1/message/${messages[0]!.ID}`);
      const { Text } = (await message.json()) as { Text: string };
      const link = Text.match(/https?:\/\/\S+\/api\/auth\/callback\/nodemailer\S+/)?.[0];
      if (link) return link;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`No sign-in email for ${email}`);
}

test("email sign-in sends a magic link that creates a reader session", async ({ page }) => {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@xuye.localhost`;

  await page.goto("/api/auth/signin");
  await page.getByRole("textbox", { name: /email/i }).fill(email);
  await page.getByRole("button", { name: /sign in with/i }).click();
  await expect(page).toHaveURL(/\/api\/auth\/verify-request/);

  const link = await waitForMagicLink(page.request, email);
  await page.goto(link);

  const session = await (await page.request.get("/api/auth/session")).json();
  expect(session.user).toMatchObject({ email, role: "reader" });
  expect(typeof session.user.id).toBe("string");
});
