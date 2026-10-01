import { z } from "zod";

const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());

export const workUpdateSchema = z.object({
  title: z.string().trim().min(1, "請輸入書名").max(200),
  authorName: z.string().trim().max(100),
  synopsis: z.string().trim().max(5000),
  status: z.enum(["ongoing", "completed"]),
  hasSexual: checkbox,
  hasViolence: checkbox,
  // Comma/、-separated tag names
  tags: z.string().transform((s) =>
    [
      ...new Set(
        s
          .split(/[,，、\n]/)
          .map((t) => t.trim())
          .filter(Boolean),
      ),
    ].slice(0, 20),
  ),
});
export type WorkUpdateInput = z.infer<typeof workUpdateSchema>;

/** "now" publishes immediately, "schedule" uses publishAt, "draft" keeps it unpublished. */
export const publishModeSchema = z.enum(["now", "schedule", "draft", "hidden", "keep"]);

export const chapterInputSchema = z
  .object({
    title: z.string().trim().min(1, "請輸入章節標題").max(200),
    kind: z.enum(["chapter", "note"]),
    body: z
      .string()
      .transform((s) => s.replace(/\r\n?/g, "\n"))
      .refine((s) => s.trim().length > 0, "請輸入內文"),
    publishMode: publishModeSchema,
    // datetime-local value, interpreted as Taiwan time
    publishAt: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.publishMode === "schedule" && !parseTaipeiLocal(value.publishAt)) {
      ctx.addIssue({ code: "custom", path: ["publishAt"], message: "請選擇發布時間" });
    }
  });
export type ChapterInput = z.infer<typeof chapterInputSchema>;

type PublishState = { status: "draft" | "published" | "hidden"; publishAt: Date | null };

/** Map a form's publish mode to the stored status/publishAt. */
export function resolvePublishState(
  input: Pick<ChapterInput, "publishMode" | "publishAt">,
  now: Date,
  current?: PublishState,
): PublishState {
  switch (input.publishMode) {
    case "now":
      return { status: "published", publishAt: now };
    case "schedule":
      return { status: "published", publishAt: parseTaipeiLocal(input.publishAt) };
    case "draft":
      return { status: "draft", publishAt: null };
    case "hidden":
      return { status: "hidden", publishAt: current?.publishAt ?? null };
    case "keep":
      return current ?? { status: "draft", publishAt: null };
  }
}

/** Parse an <input type="datetime-local"> value as Asia/Taipei time. */
export function parseTaipeiLocal(value: string | undefined | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value)) return null;
  const date = new Date(`${value}${value.length === 16 ? ":00" : ""}+08:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Default value for a schedule picker: one hour from now, Taipei time. */
export const defaultScheduleValue = () => toTaipeiLocal(new Date(Date.now() + 3600_000));

/** Format a Date for <input type="datetime-local"> in Asia/Taipei time. */
export function toTaipeiLocal(date: Date): string {
  return new Date(date.getTime() + 8 * 3600_000).toISOString().slice(0, 16);
}
