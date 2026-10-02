import { z } from "zod";
import { userOrResponse } from "@/server/authz";
import { getDb } from "@/server/db";
import { setBookshelfItem } from "@/server/services/reader-account";

const schema = z.object({ workId: z.number().int().positive(), saved: z.boolean() });

export async function PUT(request: Request) {
  const user = await userOrResponse();
  if (user instanceof Response) return user;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_bookshelf_item" }, { status: 400 });
  const found = await setBookshelfItem(getDb(), user.id, parsed.data.workId, parsed.data.saved);
  if (!found) return Response.json({ error: "work_not_found" }, { status: 404 });
  return Response.json({ saved: parsed.data.saved });
}
