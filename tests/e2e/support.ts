import { expect, type APIRequestContext, type Page } from "@playwright/test";
import postgres from "postgres";
import { e2eDatabaseUrl, MAILPIT_URL } from "./env";

export const uniqueEmail = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@xuye.localhost`;

async function waitForMagicLink(request: APIRequestContext, email: string): Promise<string> {
  for (let attempt = 0; attempt < 30; attempt++) {
    const search = await request.get(`${MAILPIT_URL}/api/v1/search`, {
      params: { query: `to:"${email}"` },
    });
    const { messages } = (await search.json()) as { messages: { ID: string }[] };
    if (messages.length > 0) {
      const message = await request.get(`${MAILPIT_URL}/api/v1/message/${messages[0]!.ID}`);
      const { Text } = (await message.json()) as { Text: string };
      const link = Text.match(/https?:\/\/\S+\/api\/auth\/callback\/nodemailer\S+/)?.[0];
      if (link) return link;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`No sign-in email for ${email}`);
}

/** Sign in through the real email magic-link flow (Mailpit). */
export async function signIn(page: Page, email: string) {
  await page.goto("/api/auth/signin");
  await page.getByRole("textbox", { name: /email/i }).fill(email);
  await page.getByRole("button", { name: /sign in with/i }).click();
  await expect(page).toHaveURL(/\/api\/auth\/verify-request/);
  await page.goto(await waitForMagicLink(page.request, email));
}

/** Grant admin directly in the E2E database (the CLI equivalent is `pnpm user:promote`). */
export async function promoteToAdmin(email: string) {
  const sql = postgres(e2eDatabaseUrl(), { max: 1 });
  try {
    const rows = await sql`update users set role = 'admin' where email = ${email} returning id`;
    if (rows.length !== 1) throw new Error(`No user ${email}`);
  } finally {
    await sql.end();
  }
}
