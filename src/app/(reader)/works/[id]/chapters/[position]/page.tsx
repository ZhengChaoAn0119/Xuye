import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ReaderChrome } from "@/components/reader-chrome";
import { t } from "@/i18n";
import { formatNumber } from "@/lib/format";
import { getWork, readChapterBody } from "@/server/catalog";
import { neighbors } from "@/server/services/catalog";
import styles from "./reader.module.css";

type Params = PageProps<"/works/[id]/chapters/[position]">["params"];
const asInt = (value: string) => (/^\d{1,9}$/.test(value) ? Number(value) : null);

/** Cached work + directory lookup; null when the chapter is not readable. */
async function loadChapter(params: Params) {
  const { id, position } = await params;
  const workId = asInt(id);
  const pos = asInt(position);
  if (workId === null || pos === null) return null;
  const work = await getWork(workId);
  const entry = work?.directory.find((c) => c.position === pos);
  if (!work || !entry || work.hasSexual) return null;
  return { work, entry };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const found = await loadChapter(params);
  if (!found) return { title: t("notFound.title"), robots: { index: false } };
  return {
    title: `${found.entry.title}｜${found.work.title}`,
    // Chapter text is quota-gated; the work page is the indexable entry point.
    robots: { index: false, follow: true },
  };
}

/** Request-time chapter text (not cached); phase 4 adds the quota check here. */
async function ChapterText({ workId, position }: { workId: number; position: number }) {
  const body = await readChapterBody(workId, position);
  if (body === null) return <p className={styles.unavailable}>{t("reader.unavailable")}</p>;
  return (
    <div className={styles.text}>
      {body.split("\n").map((paragraph, i) => (
        <p key={i}>{paragraph}</p>
      ))}
    </div>
  );
}

function TextSkeleton() {
  return (
    <div className={styles.textSkeleton} aria-busy="true" aria-label={t("common.loading")}>
      {Array.from({ length: 8 }, (_, i) => (
        <span key={i} />
      ))}
    </div>
  );
}

async function Reader({ params }: { params: Params }) {
  const found = await loadChapter(params);
  if (!found) notFound();
  const { work, entry } = found;
  const { prev, next } = neighbors(
    work.directory.map((c) => c.position),
    entry.position,
  );
  const minutes = Math.max(1, Math.round(entry.wordCount / 500));

  return (
    <>
      <ReaderChrome
        workId={work.id}
        workTitle={work.title}
        chapterTitle={entry.title}
        current={entry.position}
        prev={prev}
        next={next}
        toc={work.directory.map((c) => ({
          position: c.position,
          title: c.title,
          isNote: c.kind === "note",
        }))}
      />
      <article className={styles.article}>
        <header className={styles.header}>
          <p className={styles.meta}>
            <Link href={`/works/${work.id}`}>{work.title}</Link>
            {work.authorName && `・${work.authorName}`}
          </p>
          {entry.kind === "note" && <p className={styles.noteBadge}>{t("reader.noteBadge")}</p>}
          <h1 className={styles.title}>{entry.title}</h1>
          <p className={styles.meta}>
            {t("reader.meta", { minutes, words: formatNumber(entry.wordCount) })}
          </p>
        </header>
        <Suspense fallback={<TextSkeleton />}>
          <ChapterText workId={work.id} position={entry.position} />
        </Suspense>
        <nav className={styles.end} aria-label={t("reader.chapterNav")}>
          <p className={styles.meta}>{t("reader.endOf", { title: entry.title })}</p>
          {next === null && <h2 className={styles.caughtUp}>{t("reader.caughtUp")}</h2>}
          <div className={styles.endActions}>
            {prev !== null ? (
              <Link
                className={styles.button}
                href={`/works/${work.id}/chapters/${prev}`}
                rel="prev"
              >
                ← {t("reader.prev")}
              </Link>
            ) : (
              <span className={styles.buttonDisabled} aria-disabled="true">
                ← {t("reader.prev")}
              </span>
            )}
            {next !== null ? (
              <Link
                className={styles.primary}
                href={`/works/${work.id}/chapters/${next}`}
                rel="next"
              >
                {t("reader.next")} →
              </Link>
            ) : (
              <Link className={styles.primary} href={`/works/${work.id}`}>
                {t("reader.back")}
              </Link>
            )}
          </div>
        </nav>
      </article>
    </>
  );
}

export default function ChapterPage({ params }: PageProps<"/works/[id]/chapters/[position]">) {
  return (
    <main id="main" className={styles.shell}>
      <Suspense fallback={<TextSkeleton />}>
        <Reader params={params} />
      </Suspense>
    </main>
  );
}
