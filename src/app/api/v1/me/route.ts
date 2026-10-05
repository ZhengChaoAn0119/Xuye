import { z } from "zod";
import { userOrResponse } from "@/server/authz";
import { getDb } from "@/server/db";
import { deleteAccount } from "@/server/services/reader-account";

const schema = z.object({ confirmEmail: z.string() });

/** Deletes the signed-in reader's account after they retype their email address. */
export async function DELETE(request: Request) {
  const user = await userOrResponse({ allowUnaccepted: true });
  if (user instanceof Response) return user;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  const typed = parsed.success ? parsed.data.confirmEmail.trim().toLowerCase() : "";
  if (!user.email || typed !== user.email.toLowerCase())
    return Response.json({ error: "confirmation_mismatch" }, { status: 400 });
  const result = await deleteAccount(getDb(), user.id);
  if (result === "admin") return Response.json({ error: "admin_account" }, { status: 403 });
  if (result === "not_found") return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ deleted: true });
}
