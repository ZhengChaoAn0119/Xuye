import { Suspense } from "react";
import AdminLoading from "../../loading";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDateTime, formatNumber } from "@/lib/format";
import { requireAdmin } from "@/server/authz";
import { defaultScheduleValue, toTaipeiLocal } from "@/server/content/schemas";
import { getDb } from "@/server/db";
import { getChapterForAdmin } from "@/server/services/admin-content";
import { updateChapterAction } from "../../actions";
import styles from "../../admin.module.css";
import { ChapterStateBadge, KindBadge } from "../../badges";
import { ChapterForm } from "../../chapter-form";

async function EditChapterPageContent({ params }: PageProps<"/admin/chapters/[id]">) {
  const { id } = await params;
  const chapterId = Number(id);
  await requireAdmin(`/admin/chapters/${id}`);
  if (!Number.isSafeInteger(chapterId)) notFound();
  const chapter = await getChapterForAdmin(getDb(), chapterId);
  if (!chapter) notFound();
  const now = new Date();

  return (
    <>
      <div className={styles.breadcrumb}>
        <Link href="/admin/works">作品</Link> ／{" "}
        <Link href={`/admin/works/${chapter.workId}`}>{chapter.workTitle}</Link> ／ 第{" "}
        {chapter.position} 章
      </div>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.title}>
            {chapter.title} <KindBadge kind={chapter.kind} />
          </h1>
          <p className={styles.subtle}>
            <ChapterStateBadge status={chapter.status} publishAt={chapter.publishAt} now={now} />{" "}
            發布時間 {formatDateTime(chapter.publishAt)}・{formatNumber(chapter.wordCount)} 字
          </p>
        </div>
      </div>
      <section className={styles.panel}>
        <ChapterForm
          action={updateChapterAction.bind(null, chapter.id)}
          defaults={{
            title: chapter.title,
            kind: chapter.kind,
            body: chapter.body,
            publishAt: chapter.publishAt
              ? toTaipeiLocal(chapter.publishAt)
              : defaultScheduleValue(),
          }}
          isEdit
          submitLabel="儲存章節"
        />
      </section>
    </>
  );
}

// Static shell renders instantly; the session check and data stream in.
export default function EditChapterPage(props: PageProps<"/admin/chapters/[id]">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <EditChapterPageContent {...props} />
    </Suspense>
  );
}
