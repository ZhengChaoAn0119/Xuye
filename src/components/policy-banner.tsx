"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  type RefObject,
  startTransition,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { acceptTermsAction, declineTermsAction } from "@/app/auth-actions";
import { t } from "@/i18n";
import { POLICY_NOTICE_KEY, TERMS_SEEN_KEY, TERMS_VERSION, termsSeenMarker } from "@/lib/terms";
import styles from "./policy-banner.module.css";

/** Set while a reader is on the decline step, so visiting settings to delete is not "continued use". */
const DECLINING_KEY = "xuye:terms-declining";
/** Reading the policies themselves is not continued use. */
const REVIEW_PATHS = new Set(["/terms", "/privacy"]);

// Storage can be unavailable (private mode, blocked site data): reads fall back to null.
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}
function read(storage: () => Storage, key: string) {
  try {
    return storage().getItem(key);
  } catch {
    return null;
  }
}
function write(storage: () => Storage, key: string, value: string | null) {
  try {
    if (value === null) storage().removeItem(key);
    else storage().setItem(key, value);
  } catch {}
  listeners.forEach((listener) => listener());
}
const local = () => localStorage;
const session = () => sessionStorage;

/** Keys that only move focus, so keyboard readers can reach the banner's buttons. */
const FOCUS_KEYS = new Set(["Tab", "Shift", "Control", "Alt", "Meta"]);
const INPUT_EVENTS = ["pointerdown", "wheel", "touchmove", "keydown"] as const;

/**
 * Any reader input outside the banner (tap, click, wheel, swipe, key press) counts as its default
 * choice; only the banner's own buttons decide otherwise. Only real input events are watched, so
 * programmatic scrolling (restoring the reading position) is not agreement. Capture phase, so
 * handlers that stop propagation still count.
 */
function useImplicitAgreement(
  ref: RefObject<HTMLElement | null>,
  onAgree: () => void,
  enabled: boolean,
) {
  // Layout effect: listening before the banner is painted, so input never meets a deaf banner.
  useLayoutEffect(() => {
    if (!enabled) return;
    const onInput = (event: Event) => {
      if (!ref.current || ref.current.contains(event.target as Node)) return;
      if (event instanceof KeyboardEvent && FOCUS_KEYS.has(event.key)) return;
      onAgree();
    };
    const options = { capture: true, passive: true };
    for (const type of INPUT_EVENTS) document.addEventListener(type, onInput, options);
    return () => {
      for (const type of INPUT_EVENTS) document.removeEventListener(type, onInput, options);
    };
  }, [enabled, onAgree, ref]);
}

const noSubscription = () => () => {};

/**
 * The bottom notice: privacy information for visitors, terms accept/decline for accounts.
 * Client-only, so it is never visible before its input listeners exist.
 */
export function PolicyBanner({ userId }: { userId: string | null }) {
  const hydrated = useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
  if (!hydrated) return null;
  return userId ? <TermsNotice userId={userId} /> : <VisitorNotice />;
}

/** Visitors only get strictly necessary cookies, so there is nothing to refuse: notice only. */
function VisitorNotice() {
  const acknowledged = useSyncExternalStore(
    subscribe,
    () => read(local, POLICY_NOTICE_KEY),
    () => TERMS_VERSION,
  );
  const [closed, setClosed] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const open = !closed && acknowledged !== TERMS_VERSION;
  const acknowledge = useCallback(() => {
    setClosed(true);
    write(local, POLICY_NOTICE_KEY, TERMS_VERSION);
  }, []);
  useImplicitAgreement(ref, acknowledge, open);
  if (!open) return null;

  return (
    <section ref={ref} className={styles.banner} aria-label={t("policy.region")}>
      <p className={styles.text}>
        {t("policy.visitorBody")}
        <Link href="/privacy">{t("privacy.title")}</Link>
        {t("terms.signInSuffix")}
      </p>
      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={acknowledge}>
          {t("policy.acknowledge")}
        </button>
      </div>
    </section>
  );
}

/**
 * Accounts without the current terms: "accept" records agreement, "decline" signs out. Not
 * choosing and then continuing (any input outside the banner, another page, or a later visit)
 * records agreement too. Once the reader has pressed "decline", nothing else counts as agreement.
 */
function TermsNotice({ userId }: { userId: string }) {
  const pathname = usePathname();
  const declining = useSyncExternalStore(
    subscribe,
    () => read(session, DECLINING_KEY) === userId,
    () => false,
  );
  const shownAt = useRef(pathname);
  const seenBefore = useRef<boolean | null>(null);
  const accepting = useRef(false);
  const [closed, setClosed] = useState(false);
  const ref = useRef<HTMLElement>(null);

  const accept = useCallback(() => {
    setClosed(true);
    if (accepting.current) return;
    accepting.current = true;
    startTransition(() => acceptTermsAction());
  }, []);
  useImplicitAgreement(ref, accept, !declining && !closed);

  useEffect(() => {
    if (declining) return;
    const marker = termsSeenMarker(userId);
    // Decided once per mount; a ref survives React's development double-run of effects.
    if (seenBefore.current === null) {
      seenBefore.current = read(local, TERMS_SEEN_KEY) === marker;
      write(local, TERMS_SEEN_KEY, marker);
    }
    if (REVIEW_PATHS.has(pathname)) return;
    if (seenBefore.current || pathname !== shownAt.current) accept();
  }, [accept, declining, pathname, userId]);

  if (closed) return null;
  if (declining) {
    return (
      <section className={styles.banner} aria-label={t("policy.region")}>
        <div className={styles.text}>
          <strong>{t("policy.declineTitle")}</strong>
          <p>{t("policy.declineBody")}</p>
          <p className={styles.links}>
            <a href="/api/v1/me/export" download>
              {t("policy.exportData")}
            </a>
            <Link href="/settings/privacy">{t("policy.deleteAccount")}</Link>
          </p>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.secondary}
            onClick={() => {
              shownAt.current = pathname;
              write(session, DECLINING_KEY, null);
            }}
          >
            {t("policy.back")}
          </button>
          <button
            type="button"
            className={styles.primary}
            onClick={() => {
              write(session, DECLINING_KEY, null);
              startTransition(() => declineTermsAction());
            }}
          >
            {t("policy.confirmDecline")}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className={styles.banner} aria-label={t("policy.region")}>
      <div className={styles.text}>
        <strong>{t("policy.termsTitle")}</strong>
        <p>
          {t("policy.termsPrefix", { version: TERMS_VERSION })}
          <Link href="/terms">{t("terms.title")}</Link>
          {t("terms.and")}
          <Link href="/privacy">{t("privacy.title")}</Link>
          {t("policy.termsSuffix")}
        </p>
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.secondary}
          onClick={() => write(session, DECLINING_KEY, userId)}
        >
          {t("policy.decline")}
        </button>
        <button type="button" className={styles.primary} onClick={accept}>
          {t("policy.accept")}
        </button>
      </div>
    </section>
  );
}
