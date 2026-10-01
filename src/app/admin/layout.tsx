import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/authz";
import styles from "./admin.module.css";

// The whole back office is per-request (session-gated); it never needs a static shell.
export const instant = false;

export const metadata: Metadata = {
  title: "後台",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin();
  return (
    <div className={styles.shell}>
      <nav className={styles.sidebar} aria-label="後台導覽">
        <Link href="/admin" className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">
            續
          </span>
          後台
        </Link>
        <Link href="/admin" className={styles.navLink}>
          總覽
        </Link>
        <Link href="/admin/works" className={styles.navLink}>
          作品
        </Link>
        <Link href="/admin/import" className={styles.navLink}>
          匯入 EPUB
        </Link>
        <span className={styles.user}>{user.email}</span>
      </nav>
      <main id="main" className={styles.main}>
        {children}
      </main>
    </div>
  );
}
