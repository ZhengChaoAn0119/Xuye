import { z } from "zod";
import { canChangeDisplayName, cleanDisplayName } from "@/lib/display-name";
import { userOrResponse } from "@/server/authz";
import { getDb } from "@/server/db";
import { getAccountProfile, setDisplayName } from "@/server/services/reader-account";

const schema = z.object({ name: z.string().max(100) });

/** Display names are a paid-member feature; Free accounts get 403. */
export async function PUT(request: Request) {
  const user = await userOrResponse();
  if (user instanceof Response) return user;
  const profile = await getAccountProfile(getDb(), user.id);
  if (!profile) return Response.json({ error: "not_found" }, { status: 404 });
  if (!canChangeDisplayName(profile.tier))
    return Response.json({ error: "paid_feature" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  const name = parsed.success ? cleanDisplayName(parsed.data.name) : null;
  if (!name) return Response.json({ error: "invalid_name" }, { status: 400 });
  await setDisplayName(getDb(), user.id, name);
  return Response.json({ name });
}
