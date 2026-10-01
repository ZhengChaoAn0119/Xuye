"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { actorFor, requireAdmin } from "@/server/authz";
import { tagsForWork } from "@/server/cache-tags";
import { chapterInputSchema, workUpdateSchema } from "@/server/content/schemas";
import { getDb } from "@/server/db";
import { createChapter, updateChapter, updateWork } from "@/server/services/admin-content";

export type FormState = { ok?: boolean; message?: string; fieldErrors?: Record<string, string[]> };

const fieldErrors = (error: z.ZodError) =>
  z.flattenError(error).fieldErrors as Record<string, string[]>;
const invalidate = (workId: number) => tagsForWork(workId).forEach((tag) => updateTag(tag));

export async function updateWorkAction(
  workId: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireAdmin(`/admin/works/${workId}`);
  const parsed = workUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  await updateWork(getDb(), workId, parsed.data, actorFor(user));
  invalidate(workId);
  return { ok: true, message: "已儲存作品資料" };
}

export async function createChapterAction(
  workId: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireAdmin(`/admin/works/${workId}/chapters/new`);
  const parsed = chapterInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  await createChapter(getDb(), workId, parsed.data, actorFor(user), new Date());
  invalidate(workId);
  redirect(`/admin/works/${workId}#chapters`);
}

export async function updateChapterAction(
  chapterId: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireAdmin(`/admin/chapters/${chapterId}`);
  const parsed = chapterInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const { workId } = await updateChapter(
    getDb(),
    chapterId,
    parsed.data,
    actorFor(user),
    new Date(),
  );
  invalidate(workId);
  return { ok: true, message: "已儲存章節" };
}
