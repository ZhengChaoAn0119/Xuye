import { expect, test } from "@playwright/test";
import { signIn, uniqueEmail } from "./support";

test("email sign-in sends a magic link that creates a reader session", async ({ page }) => {
  const email = uniqueEmail("e2e-reader");
  await signIn(page, email);

  const session = await (await page.request.get("/api/auth/session")).json();
  expect(session.user).toMatchObject({ email, role: "reader" });
  expect(typeof session.user.id).toBe("string");
});
