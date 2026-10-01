import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChapterDirectory } from "@/components/chapter-directory";
import { WorkCover } from "@/components/work-cover";
import { t } from "@/i18n";
import { formatDateTime, formatNumber } from "@/lib/format";
import { getWork } from "@/server/catalog";
import styles from "./work.module.css";

const parseId = (id: string) => (/^\d{1,9}$/.test(id) ? Number(id) : null);

async function loadWork(params: PageProps<"/works/[id]">["params"]) {
  const id = parseId((await params).id);
  return id === null ? null : getWork(id);
}

export async function generateMetadata({ params }: PageProps<"/works/[id]">): Promise<Metadata> {
  const work = await loadWork(params);
  if (!work) return { title: t("notFound.title"), robots: { index: false } };
  const description =
    work.synopsis.slice(0, 120) ||
    `${work.title}${work.authorName ? `｜${work.authorName}` : ""}｜${t("common.chapters", { count: work.chapterCount })}`;
  return {
    title: work.title,
    description,
    // canonical/openGraph URLs need metadataBase; added in phase 5 with the public domain.
    robots: work.hasSexual ? { index: false } : undefined,
  };
}

async function WorkDetail({ params }: Pick<PageProps<"/works/[id]">, "params">) {
  const work = await loadWork(params);
  if (!work) notFound();

  const firstStory = work.directory.find((c) => c.kind === "chapter") ?? work.directory[0];
  const statusLabel = work.status === "completed" ? t("common.completed") : t("common.ongoing");

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.cover}>
          <WorkCover workId={work.id} title={work.title} author={work.authorName} size="detail" />
        </div>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>
            {statusLabel}
            {work.tags.length > 0 && `・${work.tags.slice(0, 3).join("・")}`}
          </p>
          <h1 className={styles.title}>{work.title}</h1>
          <p className={styles.author}>
            {work.authorName ? t("work.by", { author: work.authorName }) : t("work.unknownAuthor")}
          </p>
          {work.tags.length > 0 && (
            <ul className={styles.tags}>
              {work.tags.map((tag) => (
                <li key={tag}>
                  <Link href={{ pathname: "/search", query: { q: tag } }}>{tag}</Link>
                </li>
              ))}
            </ul>
          )}
          <p className={styles.synopsis}>{work.synopsis || t("work.noSynopsis")}</p>
          {work.hasSexual ? (
            <div className={styles.restricted} role="note">
              <strong>{t("work.restrictedTitle")}</strong>
              <p>{t("work.restrictedBody")}</p>
            </div>
          ) : (
            <div className={styles.actions}>
              {firstStory && (
                <Link
                  className={styles.primary}
                  href={`/works/${work.id}/chapters/${firstStory.position}`}
                >
                  {t("work.startReading")}
                </Link>
              )}
              {work.latestChapter && (
                <Link
                  className={styles.secondary}
                  href={`/works/${work.id}/chapters/${work.latestChapter.position}`}
                >
                  {t("work.latestChapter")}
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      <dl className={styles.facts}>
        <div>
          <dt>{t("work.factChapters")}</dt>
          <dd>{t("common.chapters", { count: work.chapterCount })}</dd>
        </div>
        <div>
          <dt>{t("work.factWords")}</dt>
          <dd>{formatNumber(work.wordCount)}</dd>
        </div>
        <div>
          <dt>{t("work.factUpdated")}</dt>
          <dd>{formatDateTime(work.lastPublishedAt)}</dd>
        </div>
      </dl>

      {!work.hasSexual && (
        <ChapterDirectory
          workId={work.id}
          items={work.directory.map((c) => ({
            position: c.position,
            title: c.title,
            isNote: c.kind === "note",
            date: formatDateTime(c.publishAt).slice(0, 10),
          }))}
        />
      )}
    </>
  );
}

function WorkSkeleton() {
  return <div className={styles.skeleton} aria-busy="true" aria-label={t("common.loading")} />;
}

export default function WorkPage({ params }: PageProps<"/works/[id]">) {
  return (
    <main id="main" className={styles.page}>
      <Suspense fallback={<WorkSkeleton />}>
        <WorkDetail params={params} />
      </Suspense>
    </main>
  );
}
