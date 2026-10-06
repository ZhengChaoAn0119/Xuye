import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ReaderChrome } from "@/components/reader-chrome";
import { ReaderProgress } from "@/components/reader-progress";
import { ReadingModePrompt } from "@/components/reading-mode-prompt";
import { VisitorTraitReporter } from "@/components/visitor-trait-reporter";
import { t } from "@/i18n";
import { getWork, readChapterBody } from "@/server/catalog";
import { neighbors } from "@/server/services/catalog";
import { getDb } from "@/server/db";
import { getRequestReader } from "@/server/reader";
import { contentAllowed, getChapterAccountState } from "@/server/services/reader-account";
import { getReadIdentity } from "@/server/request-identity";
import { ChapterEnd } from "./chapter-end";
import { ChapterStream } from "./chapter-stream";
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
  if (!work || !entry) return null;
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
async function ChapterText({
  workId,
  position,
  chapterId,
  kind,
  userId,
  initialScrollProgress,
  chapterTitle,
  prev,
  next,
}: {
  workId: number;
  position: number;
  chapterId: number;
  kind: "chapter" | "note";
  userId: string | null;
  initialScrollProgress: number;
  chapterTitle: string;
  prev: number | null;
  next: number | null;
}) {
  const identity = await getReadIdentity(userId);
  const result = await readChapterBody(workId, position, chapterId, kind, identity);
  if (result.status === "quota" || result.status === "rate") {
    return (
      <section className={styles.restricted} role="note">
        <h2>{t(result.status === "quota" ? "reader.quotaTitle" : "reader.rateTitle")}</h2>
        <p>
          {t(result.status === "quota" ? "reader.quotaBody" : "reader.rateBody", {
            time: result.authorization.retryAt.toLocaleString("zh-TW"),
          })}
        </p>
        <div className={styles.endActions}>
          <Link className={styles.button} href={`/works/${workId}`}>
            {t("reader.back")}
          </Link>
          {userId && (
            <Link className={styles.primary} href="/account">
              {t("nav.account")}
            </Link>
          )}
        </div>
      </section>
    );
  }
  if (result.status !== "ok")
    return <p className={styles.unavailable}>{t("reader.unavailable")}</p>;
  return (
    <>
      {userId && (
        <ReaderProgress
          workId={workId}
          chapterPosition={position}
          initialScrollProgress={initialScrollProgress}
        />
      )}
      <div className={styles.text}>
        {result.body.split("\n").map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
      <ChapterEnd
        workId={workId}
        position={position}
        title={chapterTitle}
        prev={prev}
        next={next}
      />
    </>
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
  const { user, preferences } = await getRequestReader(
    `/works/${work.id}/chapters/${entry.position}`,
  );
  const allowed = contentAllowed(work, preferences);
  const accountState = user
    ? await getChapterAccountState(getDb(), user.id, entry.id, work.id)
    : { bookmarked: false, progress: null };
  const { prev, next } = neighbors(
    work.directory.map((c) => c.position),
    entry.position,
  );

  return (
    <>
      <ReaderChrome
        workId={work.id}
        workTitle={work.title}
        chapterTitle={entry.title}
        current={entry.position}
        chapterId={entry.id}
        prev={prev}
        next={next}
        toc={work.directory.map((c) => ({
          position: c.position,
          title: c.title,
          isNote: c.kind === "note",
        }))}
        signedIn={Boolean(user)}
        initialBookmarked={accountState.bookmarked}
      />
      {!user && <VisitorTraitReporter />}
      <ReadingModePrompt signedIn={Boolean(user)} />
      <article className={styles.article} data-chapter-position={entry.position}>
        {/* The top bar already names the book; the chapter opens with just its title. */}
        <header className={styles.header}>
          {entry.kind === "note" && <p className={styles.noteBadge}>{t("reader.noteBadge")}</p>}
          <h1 className={styles.title}>{entry.title}</h1>
        </header>
        {allowed ? (
          <Suspense fallback={<TextSkeleton />}>
            <ChapterText
              workId={work.id}
              position={entry.position}
              chapterId={entry.id}
              kind={entry.kind}
              userId={user?.id ?? null}
              initialScrollProgress={
                accountState.progress?.chapterPosition === entry.position
                  ? accountState.progress.scrollProgress
                  : 0
              }
              chapterTitle={entry.title}
              prev={prev}
              next={next}
            />
          </Suspense>
        ) : (
          <section className={styles.restricted} role="note">
            <h2>{t("work.restrictedTitle")}</h2>
            <p>{t(user ? "work.restrictedReady" : "work.restrictedBody")}</p>
            <Link
              href={
                user
                  ? "/account"
                  : `/signin?callbackUrl=${encodeURIComponent(`/works/${work.id}/chapters/${entry.position}`)}`
              }
            >
              {user ? t("nav.account") : t("nav.signIn")}
            </Link>
          </section>
        )}
      </article>
      {allowed && (
        <ChapterStream
          workId={work.id}
          workTitle={work.title}
          initial={{
            id: entry.id,
            position: entry.position,
            title: entry.title,
            prev,
            next,
            bookmarked: accountState.bookmarked,
          }}
        />
      )}
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
