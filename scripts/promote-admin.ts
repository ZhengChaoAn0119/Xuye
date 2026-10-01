/**
 * Grant the admin role to an existing account.
 *
 *   pnpm user:promote <email>
 *
 * The account must exist: sign in once (email link) before promoting.
 */
import { eq } from "drizzle-orm";
import { openDb } from "./cli-env";
import { users } from "@/server/db/schema";
import { recordAudit } from "@/server/services/audit";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("用法：pnpm user:promote <email>");
  process.exit(1);
}

async function main(email: string) {
  const { db, close } = openDb();
  try {
    const [user] = await db
      .update(users)
      .set({ role: "admin" })
      .where(eq(users.email, email))
      .returning({ id: users.id });
    if (!user) {
      console.error(`找不到帳號 ${email}。請先用這個 Email 登入一次，再執行本指令。`);
      process.exitCode = 1;
    } else {
      await recordAudit(
        db,
        { id: null, label: "cli:user-promote" },
        {
          action: "user.promote",
          entityType: "user",
          entityId: user.id,
          detail: { role: "admin" },
        },
      );
      console.log(`${email} 已設為管理員。`);
    }
  } finally {
    await close();
  }
}

void main(email);
