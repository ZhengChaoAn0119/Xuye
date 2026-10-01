"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import styles from "./site-header.module.css";

type NavProps = { label: string; latest: string };

function NavLinks({ label, latest, activePath }: NavProps & { activePath: string | null }) {
  const latestActive = activePath === "/";
  return (
    <nav className={styles.secondary} aria-label={label}>
      <Link
        href="/"
        className={latestActive ? styles.active : undefined}
        aria-current={latestActive ? "page" : undefined}
      >
        {latest}
      </Link>
    </nav>
  );
}

function ActiveNav(props: NavProps) {
  return <NavLinks {...props} activePath={usePathname()} />;
}

/**
 * The pathname is request data, so the highlighted version streams in; the
 * static fallback keeps the header in every prerendered shell.
 */
export function SiteNav(props: NavProps) {
  return (
    <Suspense fallback={<NavLinks {...props} activePath={null} />}>
      <ActiveNav {...props} />
    </Suspense>
  );
}
