import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/server/authz";
import { AdminNav } from "./admin-nav";
import styles from "./admin.module.css";

export const instant = false;

export const metadata: Metadata = {
  title: "管理後台",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin();
  return (
    <div className={styles.shell}>
      <Suspense fallback={<div className={styles.sidebar} />}>
        <AdminNav email={user.email ?? user.id} />
      </Suspense>
      <main id="main" className={styles.main}>
        {children}
      </main>
    </div>
  );
}
