import { z } from "zod";
import { userOrResponse } from "@/server/authz";
import { getDb } from "@/server/db";
import { setBookmark } from "@/server/services/reader-account";

const schema = z.object({ chapterId: z.number().int().positive(), bookmarked: z.boolean() });

export async function PUT(request: Request) {
  const user = await userOrResponse();
  if (user instanceof Response) return user;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_bookmark" }, { status: 400 });
  const found = await setBookmark(getDb(), user.id, parsed.data.chapterId, parsed.data.bookmarked);
  if (!found) return Response.json({ error: "chapter_not_found" }, { status: 404 });
  return Response.json({ bookmarked: parsed.data.bookmarked });
}
