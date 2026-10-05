"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/auth-actions";
import styles from "./admin.module.css";

const links = [
  { href: "/admin", label: "總覽", exact: true },
  { href: "/admin/works", label: "作品", exact: false },
  { href: "/admin/import", label: "匯入 EPUB", exact: false },
  { href: "/admin/quota", label: "閱讀額度", exact: false },
] as const;

export function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();
  return (
    <nav className={styles.sidebar} aria-label="管理後台導覽">
      <Link href="/admin" className={styles.brand}>
        <span className={styles.brandMark} aria-hidden="true">
          續
        </span>
        管理後台
      </Link>
      {links.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
            aria-current={active ? "page" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
      <div className={styles.sidebarUtility}>
        <Link href="/">查看網站</Link>
        <Link href="/account">我的帳號</Link>
        <span className={styles.user}>{email}</span>
        <form action={signOutAction}>
          <button className={styles.navButton}>登出</button>
        </form>
      </div>
    </nav>
  );
}
