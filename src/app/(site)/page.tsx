import { connection } from "next/server";
import { Suspense } from "react";
import { GridSkeleton } from "@/components/grid-skeleton";
import { WorksBrowser } from "@/components/works-browser";
import { t } from "@/i18n";
import { toWorkCard } from "@/lib/work-card";
import { getLatestWorks } from "@/server/catalog";
import { getRequestReader } from "@/server/reader";
import { contentAllowed } from "@/server/services/reader-account";
import styles from "./site.module.css";

async function LatestWorks() {
  // Render per request from cached data, so `next build` never needs the database.
  await connection();
  const [works, { preferences }] = await Promise.all([getLatestWorks(), getRequestReader()]);
  const visible = works.filter((work) => contentAllowed(work, preferences));
  return (
    <>
      <p className={styles.count}>{t("home.count", { count: visible.length })}</p>
      <WorksBrowser works={visible.map(toWorkCard)} />
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
