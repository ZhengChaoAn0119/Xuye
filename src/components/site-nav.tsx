"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import styles from "./site-header.module.css";

type NavProps = { label: string; latest: string; library: string; history: string };

function NavLinks({
  label,
  latest,
  library,
  history,
  activePath,
}: NavProps & { activePath: string | null }) {
  const latestActive = activePath === "/";
  const links = [
    ["/", latest, latestActive],
    ["/library", library, activePath === "/library"],
    ["/history", history, activePath === "/history"],
  ] as const;
  return (
    <nav className={styles.secondary} aria-label={label}>
      {links.map(([href, text, active]) => (
        <Link
          key={href}
          href={href}
          className={active ? styles.active : undefined}
          aria-current={active ? "page" : undefined}
        >
          {text}
        </Link>
      ))}
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
