import { Suspense } from "react";
import AdminLoading from "../../../../loading";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/authz";
import { defaultScheduleValue } from "@/server/content/schemas";
import { getDb } from "@/server/db";
import { getWorkForAdmin } from "@/server/services/admin-content";
import { createChapterAction } from "../../../../actions";
import styles from "../../../../admin.module.css";
import { ChapterForm } from "../../../../chapter-form";

async function NewChapterPageContent({ params }: PageProps<"/admin/works/[id]/chapters/new">) {
  const { id } = await params;
  const workId = Number(id);
  await requireAdmin(`/admin/works/${id}/chapters/new`);
  if (!Number.isSafeInteger(workId)) notFound();
  const work = await getWorkForAdmin(getDb(), workId);
  if (!work) notFound();
  const next = work.chapters.length + 1;

  return (
    <>
      <div className={styles.breadcrumb}>
        <Link href="/admin/works">作品</Link> ／{" "}
        <Link href={`/admin/works/${work.id}`}>{work.title}</Link> ／ 新增章節
      </div>
      <div className={styles.pageHead}>
        <h1 className={styles.title}>新增第 {next} 章</h1>
      </div>
      <section className={styles.panel}>
        <ChapterForm
          action={createChapterAction.bind(null, work.id)}
          defaults={{
            title: `第${next}章 `,
            kind: "chapter",
            body: "",
            publishAt: defaultScheduleValue(),
          }}
          isEdit={false}
          submitLabel="新增章節"
          cancelHref={`/admin/works/${String(work.id)}`}
        />
      </section>
    </>
  );
}

// Static shell renders instantly; the session check and data stream in.
export default function NewChapterPage(props: PageProps<"/admin/works/[id]/chapters/new">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <NewChapterPageContent {...props} />
    </Suspense>
  );
}
