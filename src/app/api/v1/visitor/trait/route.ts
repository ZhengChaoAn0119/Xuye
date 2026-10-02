import { z } from "zod";
import { serverEnv } from "@/env";
import { privateHash, visitorSecret } from "@/lib/visitor-identity";
import { getDb } from "@/server/db";
import { getVisitorRequestIdentity } from "@/server/request-identity";
import { saveVisitorTrait } from "@/server/services/quota";

const traitSchema = z.object({
  language: z.string().max(35),
  timezone: z.string().max(100),
  screenWidth: z.number().int().min(0).max(20_000),
  screenHeight: z.number().int().min(0).max(20_000),
  colorDepth: z.number().int().min(0).max(128),
  touchPoints: z.number().int().min(0).max(100),
});

export async function POST(request: Request) {
  const identity = await getVisitorRequestIdentity();
  if (!identity?.visitorCookieId)
    return Response.json({ error: "visitor identity unavailable" }, { status: 400 });
  const parsed = traitSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid trait" }, { status: 400 });
  const secret = visitorSecret(serverEnv());
  const canonical = JSON.stringify(parsed.data);
  await saveVisitorTrait(
    getDb(),
    identity.visitorCookieId,
    identity.ipHash,
    privateHash(canonical, secret, "trait"),
    new Date(),
  );
  return Response.json({ ok: true });
}
