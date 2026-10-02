import type { Metadata } from "next";
import { Suspense } from "react";
import { LibraryList } from "@/components/library-list";
import { t } from "@/i18n";
import { toWorkCard } from "@/lib/work-card";
import { requireUser } from "@/server/authz";
import { getDb } from "@/server/db";
import {
  contentAllowed,
  getReaderPreferences,
  listBookshelf,
} from "@/server/services/reader-account";
import styles from "../site.module.css";

export const metadata: Metadata = { title: t("library.title"), robots: { index: false } };

async function LibraryContent() {
  const user = await requireUser("/library");
  const [{ preferences }, entries] = await Promise.all([
    getReaderPreferences(getDb(), user.id),
    listBookshelf(getDb(), user.id, new Date()),
  ]);
  const visible = entries.filter(({ work }) => contentAllowed(work, preferences));
  return (
    <LibraryList initial={visible.map((entry) => ({ ...entry, work: toWorkCard(entry.work) }))} />
  );
}

export default function LibraryPage() {
  return (
    <main id="main" className={styles.page}>
      <div className={styles.pageHead}>
        <div>
          <p className={styles.eyebrow}>{t("library.eyebrow")}</p>
          <h1 className={styles.title}>{t("library.title")}</h1>
          <p className={styles.subhead}>{t("library.subhead")}</p>
        </div>
      </div>
      <Suspense fallback={<p>{t("common.loading")}</p>}>
        <LibraryContent />
      </Suspense>
    </main>
  );
}
