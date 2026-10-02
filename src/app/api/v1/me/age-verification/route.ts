import { z } from "zod";
import { userOrResponse } from "@/server/authz";
import { getDb } from "@/server/db";
import { verifyAdult } from "@/server/services/reader-account";

const schema = z.object({ birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

export async function POST(request: Request) {
  const user = await userOrResponse();
  if (user instanceof Response) return user;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_birth_date" }, { status: 400 });
  const verified = await verifyAdult(getDb(), user.id, parsed.data.birthDate, new Date());
  if (!verified) return Response.json({ error: "age_requirement_not_met" }, { status: 403 });
  return Response.json({ verified: true });
}
