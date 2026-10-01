import { Suspense } from "react";
import AdminLoading from "./loading";
import Link from "next/link";
import { formatDateTime, formatNumber } from "@/lib/format";
import { requireAdmin } from "@/server/authz";
import { getDb } from "@/server/db";
import { getDashboardStats, listScheduledChapters } from "@/server/services/admin-content";
import styles from "./admin.module.css";

async function AdminDashboardContent() {
  await requireAdmin("/admin");
  const now = new Date();
  const db = getDb();
  const [stats, scheduled] = await Promise.all([
    getDashboardStats(db, now),
    listScheduledChapters(db, now),
  ]);

  const tiles = [
    ["作品", stats.works],
    ["章節（含公告）", stats.chapters],
    ["總字數", stats.words],
    ["作者公告", stats.notes],
    ["排程中", stats.scheduled],
    ["草稿", stats.drafts],
    ["隱藏", stats.hidden],
  ] as const;

  return (
    <>
      <div className={styles.pageHead}>
        <h1 className={styles.title}>總覽</h1>
        <span className={styles.subtle}>{formatDateTime(now)}（台北時間）</span>
      </div>
      <section className={styles.stats} aria-label="統計">
        {tiles.map(([label, value]) => (
          <div key={label} className={styles.stat}>
            <strong>{formatNumber(value ?? 0)}</strong>
            <span>{label}</span>
          </div>
        ))}
      </section>
      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>即將發布</h2>
        {scheduled.length === 0 ? (
          <p className={styles.subtle}>目前沒有排程中的章節。</p>
        ) : (
          <ul className={styles.planList}>
            {scheduled.map((c) => (
              <li key={c.id}>
                {formatDateTime(c.publishAt)}｜
                <Link href={`/admin/works/${c.workId}`}>{c.workTitle}</Link>｜
                <Link href={`/admin/chapters/${c.id}`}>{c.title}</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

// Static shell renders instantly; the session check and data stream in.
export default function AdminDashboard() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminDashboardContent />
    </Suspense>
  );
}
