import { z } from "zod";
import { userOrResponse } from "@/server/authz";
import { getDb } from "@/server/db";
import { getReaderPreferences, saveReaderPreferences } from "@/server/services/reader-account";

const preferencesSchema = z
  .object({
    readerFontSize: z.number().int().min(15).max(26),
    readerTheme: z.enum(["sepia", "white", "dark"]),
    readerFont: z.enum(["serif", "sans"]),
    sitePalette: z.enum(["a1", "a2", "a3"]),
    lineHeight: z.number().int().min(150).max(260),
    pageWidth: z.number().int().min(560).max(920),
    autoNextChapter: z.boolean(),
    showSexual: z.boolean(),
    showViolence: z.boolean(),
    showBadge: z.boolean(),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0);

export async function GET() {
  const user = await userOrResponse();
  if (user instanceof Response) return user;
  return Response.json(await getReaderPreferences(getDb(), user.id));
}

export async function PUT(request: Request) {
  const user = await userOrResponse();
  if (user instanceof Response) return user;
  const parsed = preferencesSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_preferences" }, { status: 400 });
  const preferences = await saveReaderPreferences(getDb(), user.id, parsed.data);
  return Response.json({ preferences });
}
