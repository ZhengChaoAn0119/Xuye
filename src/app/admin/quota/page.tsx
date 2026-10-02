import { Suspense } from "react";
import { requireAdmin } from "@/server/authz";
import { getDb } from "@/server/db";
import { getQuotaAdminOverview } from "@/server/services/quota";
import styles from "../admin.module.css";
import { QuotaForm } from "./quota-form";

async function QuotaContent() {
  await requireAdmin("/admin/quota");
  const overview = await getQuotaAdminOverview(getDb(), new Date());
  return (
    <>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <strong>{overview.visitors.toLocaleString("zh-TW")}</strong>
          <span>已辨識訪客</span>
        </div>
        <div className={styles.stat}>
          <strong>{overview.activeWindows.toLocaleString("zh-TW")}</strong>
          <span>有效的 24 小時視窗</span>
        </div>
      </div>
      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>每 24 小時可讀章數</h2>
        <QuotaForm
          visitor={overview.values.visitor}
          free={overview.values.free}
          rereadGraceMinutes={overview.values.rereadGraceMinutes}
        />
      </section>
      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>防止大量自動讀取</h2>
        <p className={styles.subtle}>
          系統會分別依帳號／訪客及 IP 計算短時間請求。IP
          門檻較寬鬆，以容納學校、公司與行動網路的共用出口。
        </p>
      </section>
    </>
  );
}

export default function AdminQuotaPage() {
  return (
    <>
      <header className={styles.pageHead}>
        <div>
          <h1 className={styles.title}>閱讀額度</h1>
          <p className={styles.subtle}>調整訪客與免費會員的滾動 24 小時閱讀容量。</p>
        </div>
      </header>
      <Suspense fallback={<p>載入中…</p>}>
        <QuotaContent />
      </Suspense>
    </>
  );
}
