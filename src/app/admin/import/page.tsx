import { Suspense } from "react";
import AdminLoading from "../loading";
import { requireAdmin } from "@/server/authz";
import styles from "../admin.module.css";
import { ImportPanel } from "./import-panel";

async function AdminImportPageContent() {
  await requireAdmin("/admin/import");
  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.title}>匯入 EPUB</h1>
          <p className={styles.subtle}>
            先預覽，確認章節判讀無誤再匯入。大量匯入也可以用指令：pnpm content:import
          </p>
        </div>
      </div>
      <section className={styles.panel}>
        <ImportPanel />
      </section>
    </>
  );
}

// Static shell renders instantly; the session check and data stream in.
export default function AdminImportPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminImportPageContent />
    </Suspense>
  );
}
