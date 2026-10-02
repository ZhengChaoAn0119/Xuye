import { and, desc, eq, gt, sql } from "drizzle-orm";
import type { Database, DbOrTx } from "@/server/db/client";
import {
  auditLogs,
  quotaCharges,
  quotaSettings,
  quotaWindows,
  rateLimitWindows,
  visitorIdentities,
} from "@/server/db/schema";
import type { Actor } from "./audit";

export type QuotaSubject = "visitor" | "free";
export type ReadIdentity = {
  subject: QuotaSubject;
  subjectKey: string;
  ipHash: string;
  visitorCookieId?: string;
};

export const DEFAULT_QUOTAS: Record<QuotaSubject, number> = { visitor: 10, free: 50 };
export const QUOTA_WINDOW_HOURS = 24;
/** Default minutes during which re-opening the same chapter is not charged again. */
export const DEFAULT_REREAD_GRACE_MINUTES = 10;

/**
 * Every server fetch of a story chapter counts toward the daily allowance; only a repeat
 * within the grace period after its last charge (reload, double click, back/forward) is free.
 * The grace runs from the charge itself, so repeated reloads cannot extend it.
 */
export function withinRereadGrace(lastChargedAt: Date | null, now: Date, graceMinutes: number) {
  if (!lastChargedAt || graceMinutes <= 0) return false;
  const elapsed = now.getTime() - lastChargedAt.getTime();
  return elapsed >= 0 && elapsed < graceMinutes * 60 * 1000;
}
export const RATE_LIMIT = {
  windowMinutes: 5,
  subjectRequests: 80,
  // Intentionally much wider for schools, offices, and mobile-carrier NATs.
  ipRequests: 400,
} as const;

export type QuotaSnapshot = {
  subject: QuotaSubject;
  limit: number;
  used: number;
  remaining: number;
  resetAt: Date | null;
};

export type ReadAuthorization =
  | ({ allowed: true; charged: boolean } & QuotaSnapshot)
  | ({ allowed: false; reason: "quota" | "rate"; retryAt: Date } & QuotaSnapshot);

export function quotaSnapshot(
  subject: QuotaSubject,
  limit: number,
  used: number,
  resetAt: Date | null,
): QuotaSnapshot {
  const safeLimit = Math.max(1, Math.round(limit));
  const safeUsed = Math.max(0, Math.round(used));
  return {
    subject,
    limit: safeLimit,
    used: safeUsed,
    remaining: Math.max(0, safeLimit - safeUsed),
    resetAt,
  };
}

const windowEnd = (start: Date, hours: number) =>
  new Date(start.getTime() + hours * 60 * 60 * 1000);

async function setting(db: DbOrTx, subject: QuotaSubject) {
  const [row] = await db
    .select()
    .from(quotaSettings)
    .where(eq(quotaSettings.subject, subject))
    .limit(1);
  return {
    chaptersPerWindow: row?.chaptersPerWindow ?? DEFAULT_QUOTAS[subject],
    windowHours: row?.windowHours ?? QUOTA_WINDOW_HOURS,
    rereadGraceMinutes: row?.rereadGraceMinutes ?? DEFAULT_REREAD_GRACE_MINUTES,
  };
}

async function activeWindow(db: DbOrTx, identity: ReadIdentity, now: Date) {
  const [row] = await db
    .select()
    .from(quotaWindows)
    .where(
      and(
        eq(quotaWindows.subject, identity.subject),
        eq(quotaWindows.subjectKey, identity.subjectKey),
        gt(quotaWindows.windowEnd, now),
      ),
    )
    .orderBy(desc(quotaWindows.windowStart))
    .limit(1);
  return row ?? null;
}

export async function getQuotaStatus(
  db: Database,
  identity: ReadIdentity,
  now: Date,
): Promise<QuotaSnapshot & { rereadGraceMinutes: number }> {
  const [config, current] = await Promise.all([
    setting(db, identity.subject),
    activeWindow(db, identity, now),
  ]);
  return {
    ...quotaSnapshot(
      identity.subject,
      config.chaptersPerWindow,
      current?.used ?? 0,
      current?.windowEnd ?? null,
    ),
    rereadGraceMinutes: config.rereadGraceMinutes,
  };
}

async function noteVisitor(db: DbOrTx, identity: ReadIdentity, now: Date) {
  if (!identity.visitorCookieId) return;
  await db
    .insert(visitorIdentities)
    .values({ cookieId: identity.visitorCookieId, ipHash: identity.ipHash, lastSeenAt: now })
    .onConflictDoUpdate({
      target: visitorIdentities.cookieId,
      set: { ipHash: identity.ipHash, lastSeenAt: now },
    });
}

const rateWindow = (now: Date) => {
  const size = RATE_LIMIT.windowMinutes * 60 * 1000;
  const start = new Date(Math.floor(now.getTime() / size) * size);
  return { start, end: new Date(start.getTime() + size) };
};

async function incrementRate(db: DbOrTx, scope: "subject" | "ip", key: string, now: Date) {
  const { start, end } = rateWindow(now);
  const [row] = await db
    .insert(rateLimitWindows)
    .values({ scope, key, windowStart: start, windowEnd: end, requests: 1 })
    .onConflictDoUpdate({
      target: [rateLimitWindows.scope, rateLimitWindows.key, rateLimitWindows.windowStart],
      set: { requests: sql`${rateLimitWindows.requests} + 1` },
    })
    .returning({ requests: rateLimitWindows.requests, windowEnd: rateLimitWindows.windowEnd });
  return row!;
}

async function checkRateLimits(db: DbOrTx, identity: ReadIdentity, now: Date) {
  const [subject, ip] = await Promise.all([
    incrementRate(db, "subject", `${identity.subject}:${identity.subjectKey}`, now),
    incrementRate(db, "ip", identity.ipHash, now),
  ]);
  const blocked =
    subject.requests > RATE_LIMIT.subjectRequests || ip.requests > RATE_LIMIT.ipRequests;
  return { blocked, retryAt: subject.windowEnd > ip.windowEnd ? subject.windowEnd : ip.windowEnd };
}

/** Atomically rate-check and charge one visible story chapter. */
export async function authorizeChapterRead(
  db: Database,
  identity: ReadIdentity,
  chapterId: number,
  now: Date,
  countQuota = true,
): Promise<ReadAuthorization> {
  return db.transaction(async (tx) => {
    await noteVisitor(tx, identity, now);
    const rate = await checkRateLimits(tx, identity, now);
    const config = await setting(tx, identity.subject);
    let current = await activeWindow(tx, identity, now);
    const currentSnapshot = () =>
      quotaSnapshot(
        identity.subject,
        config.chaptersPerWindow,
        current?.used ?? 0,
        current?.windowEnd ?? null,
      );
    if (rate.blocked)
      return { allowed: false, reason: "rate", retryAt: rate.retryAt, ...currentSnapshot() };
    // Author announcements are protected by request-rate limits but never use
    // a chapter from the reader's daily allowance.
    if (!countQuota) return { allowed: true, charged: false, ...currentSnapshot() };

    // Serialize quota decisions for a subject so simultaneous requests cannot
    // create extra windows or exceed the configured chapter count.
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${`${identity.subject}:${identity.subjectKey}`}, 0))`,
    );
    current = await activeWindow(tx, identity, now);
    if (!current) {
      const [created] = await tx
        .insert(quotaWindows)
        .values({
          subject: identity.subject,
          subjectKey: identity.subjectKey,
          windowStart: now,
          windowEnd: windowEnd(now, config.windowHours),
          used: 0,
        })
        .returning();
      current = created!;
    }

    const [latest] = await tx
      .select({ chargedAt: quotaCharges.chargedAt })
      .from(quotaCharges)
      .where(and(eq(quotaCharges.windowId, current.id), eq(quotaCharges.chapterId, chapterId)))
      .orderBy(desc(quotaCharges.chargedAt))
      .limit(1);
    if (withinRereadGrace(latest?.chargedAt ?? null, now, config.rereadGraceMinutes))
      return { allowed: true, charged: false, ...currentSnapshot() };
    if (current.used >= config.chaptersPerWindow) {
      return {
        allowed: false,
        reason: "quota",
        retryAt: current.windowEnd,
        ...currentSnapshot(),
      };
    }

    await tx.insert(quotaCharges).values({ windowId: current.id, chapterId, chargedAt: now });
    const [updated] = await tx
      .update(quotaWindows)
      .set({ used: sql`${quotaWindows.used} + 1` })
      .where(eq(quotaWindows.id, current.id))
      .returning();
    current = updated!;
    return { allowed: true, charged: true, ...currentSnapshot() };
  });
}

export async function saveQuotaSettings(
  db: Database,
  values: Record<QuotaSubject, number> & { rereadGraceMinutes: number },
  actor: Actor,
  now: Date,
) {
  await db.transaction(async (tx) => {
    for (const subject of ["visitor", "free"] as const) {
      await tx
        .insert(quotaSettings)
        .values({
          subject,
          chaptersPerWindow: values[subject],
          windowHours: QUOTA_WINDOW_HOURS,
          rereadGraceMinutes: values.rereadGraceMinutes,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: quotaSettings.subject,
          set: {
            chaptersPerWindow: values[subject],
            rereadGraceMinutes: values.rereadGraceMinutes,
            updatedAt: now,
          },
        });
    }
    await tx.insert(auditLogs).values({
      actorId: actor.id,
      actorLabel: actor.label,
      action: "quota.settings.update",
      entityType: "quota_settings",
      entityId: "global",
      detail: values,
      createdAt: now,
    });
  });
}

export async function getQuotaAdminOverview(db: Database, now: Date) {
  const rows = await db.select().from(quotaSettings);
  const values = { ...DEFAULT_QUOTAS, rereadGraceMinutes: DEFAULT_REREAD_GRACE_MINUTES };
  for (const row of rows) {
    values[row.subject] = row.chaptersPerWindow;
    values.rereadGraceMinutes = row.rereadGraceMinutes;
  }
  const [{ visitors = 0 } = {}] = await db
    .select({ visitors: sql<number>`count(*)::int` })
    .from(visitorIdentities);
  const [{ activeWindows = 0 } = {}] = await db
    .select({ activeWindows: sql<number>`count(*)::int` })
    .from(quotaWindows)
    .where(gt(quotaWindows.windowEnd, now));
  return { values, visitors, activeWindows };
}

export async function saveVisitorTrait(
  db: Database,
  cookieId: string,
  ipHash: string,
  traitHash: string,
  now: Date,
) {
  await db
    .insert(visitorIdentities)
    .values({ cookieId, ipHash, traitHash, lastSeenAt: now })
    .onConflictDoUpdate({
      target: visitorIdentities.cookieId,
      set: { ipHash, traitHash, lastSeenAt: now },
    });
}
