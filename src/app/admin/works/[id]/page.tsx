import { Suspense } from "react";
import AdminLoading from "../../loading";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDateTime, formatNumber } from "@/lib/format";
import { requireAdmin } from "@/server/authz";
import { getDb } from "@/server/db";
import { getWorkForAdmin } from "@/server/services/admin-content";
import styles from "../../admin.module.css";
import { ChapterStateBadge, KindBadge } from "../../badges";
import { WorkForm } from "./work-form";

async function AdminWorkPageContent({ params }: PageProps<"/admin/works/[id]">) {
  const { id } = await params;
  const workId = Number(id);
  await requireAdmin(`/admin/works/${id}`);
  if (!Number.isSafeInteger(workId)) notFound();
  const work = await getWorkForAdmin(getDb(), workId);
  if (!work) notFound();

  const now = new Date();
  const words = work.chapters.reduce((sum, c) => sum + c.wordCount, 0);

  return (
    <>
      <div className={styles.breadcrumb}>
        <Link href="/admin/works">作品</Link> ／ #{work.id}
      </div>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.title}>{work.title}</h1>
          <p className={styles.subtle}>
            {formatNumber(work.chapters.length)} 章・{formatNumber(words)} 字・最後修改{" "}
            {formatDateTime(work.updatedAt)}
          </p>
        </div>
        <Link
          href={`/admin/works/${work.id}/chapters/new`}
          className={`${styles.button} ${styles.primary}`}
        >
          新增章節
        </Link>
      </div>

      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>作品資料</h2>
        <WorkForm
          workId={work.id}
          defaults={{
            title: work.title,
            authorName: work.authorName ?? "",
            synopsis: work.synopsis,
            status: work.status,
            hasSexual: work.hasSexual,
            hasViolence: work.hasViolence,
            tags: work.tags,
          }}
        />
      </section>

      <h2 className={styles.panelTitle} id="chapters">
        章節目錄
      </h2>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.num}>#</th>
              <th>標題</th>
              <th>狀態</th>
              <th>發布時間</th>
              <th className={styles.num}>字數</th>
            </tr>
          </thead>
          <tbody>
            {work.chapters.map((c) => (
              <tr key={c.id}>
                <td className={styles.num}>{c.position}</td>
                <td className={styles.wrap}>
                  <Link href={`/admin/chapters/${c.id}`}>{c.title}</Link>{" "}
                  <KindBadge kind={c.kind} />
                </td>
                <td>
                  <ChapterStateBadge status={c.status} publishAt={c.publishAt} now={now} />
                </td>
                <td>{formatDateTime(c.publishAt)}</td>
                <td className={styles.num}>{formatNumber(c.wordCount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// Static shell renders instantly; the session check and data stream in.
export default function AdminWorkPage(props: PageProps<"/admin/works/[id]">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminWorkPageContent {...props} />
    </Suspense>
  );
}
