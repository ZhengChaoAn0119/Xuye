import { z } from "zod";
import { userOrResponse } from "@/server/authz";
import { getDb } from "@/server/db";
import { hideHistory, restoreHistory } from "@/server/services/reader-account";

const schema = z.object({ workId: z.number().int().positive().optional() });
const restoreSchema = z.object({
  workIds: z.array(z.number().int().positive()).min(1).max(1_000),
});

export async function DELETE(request: Request) {
  const user = await userOrResponse();
  if (user instanceof Response) return user;
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: "invalid_history_item" }, { status: 400 });
  await hideHistory(getDb(), user.id, parsed.data.workId);
  return Response.json({ removed: true });
}

export async function PUT(request: Request) {
  const user = await userOrResponse();
  if (user instanceof Response) return user;
  const parsed = restoreSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: "invalid_history_items" }, { status: 400 });
  await restoreHistory(getDb(), user.id, parsed.data.workIds);
  return Response.json({ restored: true });
}
