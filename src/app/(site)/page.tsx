import { connection } from "next/server";
import { Suspense } from "react";
import { GridSkeleton } from "@/components/grid-skeleton";
import { WorksBrowser } from "@/components/works-browser";
import { t } from "@/i18n";
import { toWorkCard } from "@/lib/work-card";
import { getLatestWorks } from "@/server/catalog";
import styles from "./site.module.css";

async function LatestWorks() {
  // Render per request from cached data, so `next build` never needs the database.
  await connection();
  const works = await getLatestWorks();
  return (
    <>
      <p className={styles.count}>{t("home.count", { count: works.length })}</p>
      <WorksBrowser works={works.map(toWorkCard)} />
    </>
  );
}

export default function HomePage() {
  return (
    <main id="main" className={styles.page}>
      <div className={styles.pageHead}>
        <div>
          <p className={styles.eyebrow}>{t("home.eyebrow")}</p>
          <h1 className={styles.title}>{t("home.title")}</h1>
          <p className={styles.subhead}>{t("home.subhead")}</p>
        </div>
      </div>
      <Suspense fallback={<GridSkeleton />}>
        <LatestWorks />
      </Suspense>
    </main>
  );
}
