import { z } from "zod";
import { userOrResponse } from "@/server/authz";
import { getDb } from "@/server/db";
import { recordReadingProgress } from "@/server/services/reader-account";

const schema = z.object({
  workId: z.number().int().positive(),
  chapterPosition: z.number().int().positive(),
  scrollProgress: z.number().int().min(0).max(10_000),
});

export async function PUT(request: Request) {
  const user = await userOrResponse();
  if (user instanceof Response) return user;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_progress" }, { status: 400 });
  const found = await recordReadingProgress(
    getDb(),
    user.id,
    parsed.data.workId,
    parsed.data.chapterPosition,
    parsed.data.scrollProgress,
    new Date(),
  );
  if (!found) return Response.json({ error: "chapter_not_found" }, { status: 404 });
  return Response.json({ saved: true });
}
