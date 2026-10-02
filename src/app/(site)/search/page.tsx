import type { Metadata } from "next";
import { Suspense } from "react";
import { GridSkeleton } from "@/components/grid-skeleton";
import { WorksBrowser } from "@/components/works-browser";
import { t } from "@/i18n";
import { toWorkCard } from "@/lib/work-card";
import { searchCatalog } from "@/server/catalog";
import { getRequestReader } from "@/server/reader";
import { contentAllowed } from "@/server/services/reader-account";
import styles from "../site.module.css";

export const metadata: Metadata = {
  title: t("nav.search"),
  // Result pages are thin and endless; keep them out of the index.
  robots: { index: false, follow: true },
};

const queryOf = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value)?.trim().slice(0, 100) ?? "";

async function SearchForm({ searchParams }: Pick<PageProps<"/search">, "searchParams">) {
  const query = queryOf((await searchParams).q);
  return (
    <form className={styles.bigSearch} action="/search" role="search">
      <input
        name="q"
        type="search"
        defaultValue={query}
        aria-label={t("nav.search")}
        placeholder={t("nav.searchPlaceholder")}
        autoFocus
      />
      <button className={styles.primaryButton}>{t("search.submit")}</button>
    </form>
  );
}

async function SearchResults({ searchParams }: Pick<PageProps<"/search">, "searchParams">) {
  const query = queryOf((await searchParams).q);
  const [works, { preferences }] = await Promise.all([searchCatalog(query), getRequestReader()]);
  const visible = works.filter((work) => contentAllowed(work, preferences));
  return (
    <>
      <div className={styles.resultsHead}>
        <h2>{query ? t("search.resultsFor", { query }) : t("search.allWorks")}</h2>
        <span className={styles.count}>{t("search.count", { count: visible.length })}</span>
      </div>
      {visible.length === 0 ? (
        <p className={styles.center}>{t("search.empty")}</p>
      ) : (
        <WorksBrowser works={visible.map(toWorkCard)} />
      )}
    </>
  );
}

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <main id="main" className={styles.page}>
      <section className={styles.searchStage}>
        <p className={styles.eyebrow}>{t("search.eyebrow")}</p>
        <h1 className={styles.title}>{t("search.title")}</h1>
        <Suspense fallback={<div className={styles.bigSearch} />}>
          <SearchForm searchParams={searchParams} />
        </Suspense>
      </section>
      <Suspense fallback={<GridSkeleton />}>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
