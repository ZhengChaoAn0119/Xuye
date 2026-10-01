import { Suspense } from "react";
import AdminLoading from "../loading";
import Link from "next/link";
import { formatDateTime, formatNumber } from "@/lib/format";
import { requireAdmin } from "@/server/authz";
import { getDb } from "@/server/db";
import { listWorksForAdmin } from "@/server/services/admin-content";
import styles from "../admin.module.css";
import { workStatusLabel } from "../badges";

async function AdminWorksPageContent() {
  await requireAdmin("/admin/works");
  const works = await listWorksForAdmin(getDb(), new Date());

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.title}>作品</h1>
          <p className={styles.subtle}>依最新發布章節排序；共 {formatNumber(works.length)} 部</p>
        </div>
        <Link href="/admin/import" className={`${styles.button} ${styles.primary}`}>
          匯入 EPUB
        </Link>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>書名</th>
              <th>作者</th>
              <th>狀態</th>
              <th className={styles.num}>公開章數</th>
              <th className={styles.num}>全部章數</th>
              <th>最新發布</th>
            </tr>
          </thead>
          <tbody>
            {works.map((w) => (
              <tr key={w.id}>
                <td className={styles.wrap}>
                  <Link href={`/admin/works/${w.id}`}>{w.title}</Link>
                </td>
                <td>{w.authorName ?? <span className={styles.subtle}>未填寫</span>}</td>
                <td>{workStatusLabel[w.status]}</td>
                <td className={styles.num}>{formatNumber(w.visibleChapters)}</td>
                <td className={styles.num}>{formatNumber(w.totalChapters)}</td>
                <td>{formatDateTime(w.lastPublishedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// Static shell renders instantly; the session check and data stream in.
export default function AdminWorksPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminWorksPageContent />
    </Suspense>
  );
}
