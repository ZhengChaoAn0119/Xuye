import type { Metadata } from "next";
import { Suspense } from "react";
import { HistoryList } from "@/components/history-list";
import { t } from "@/i18n";
import { requireUser } from "@/server/authz";
import { getDb } from "@/server/db";
import {
  contentAllowed,
  getReaderPreferences,
  listReadingHistory,
} from "@/server/services/reader-account";
import styles from "../site.module.css";

export const metadata: Metadata = { title: t("history.title"), robots: { index: false } };

async function HistoryContent() {
  const user = await requireUser("/history");
  const [{ preferences }, entries] = await Promise.all([
    getReaderPreferences(getDb(), user.id),
    listReadingHistory(getDb(), user.id, new Date()),
  ]);
  return (
    <HistoryList
      initial={entries
        .filter((entry) => contentAllowed(entry, preferences))
        .map((entry) => ({ ...entry, updatedAt: entry.updatedAt.toISOString() }))}
    />
  );
}

export default function HistoryPage() {
  return (
    <main id="main" className={styles.page}>
      <div className={styles.pageHead}>
        <div>
          <p className={styles.eyebrow}>{t("history.eyebrow")}</p>
          <h1 className={styles.title}>{t("history.title")}</h1>
          <p className={styles.subhead}>{t("history.subhead")}</p>
        </div>
      </div>
      <Suspense fallback={<p>{t("common.loading")}</p>}>
        <HistoryContent />
      </Suspense>
    </main>
  );
}
