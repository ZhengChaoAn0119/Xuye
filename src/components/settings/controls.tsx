"use client";

import { type ReactNode, useState } from "react";
import { t } from "@/i18n";
import { loadPrefs, type ReaderPrefs, setLocalPrefs, syncPrefs } from "../reader-prefs";
import { usePrefs } from "../use-prefs";
import styles from "./settings.module.css";

/**
 * Device preferences for a settings page. Every change applies at once; signed-in readers
 * also save it to their account, and a failed save rolls the device back.
 */
export function usePrefSettings(signedIn: boolean) {
  const prefs = usePrefs();
  const [message, setMessage] = useState("");
  const update = async (patch: Partial<ReaderPrefs>) => {
    const previous = loadPrefs();
    setLocalPrefs(patch);
    if (!signedIn) {
      setMessage(t("settings.savedLocal"));
      return;
    }
    const ok = await syncPrefs(patch);
    if (!ok) setLocalPrefs(previous);
    setMessage(ok ? t("account.saved") : t("account.saveFailed"));
  };
  return { prefs, update, message, setMessage };
}

export function Group({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className={styles.group} aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {children}
    </section>
  );
}

export function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.setting}>
      <div>
        <strong>{label}</strong>
        {hint && <small>{hint}</small>}
      </div>
      {children}
    </div>
  );
}

export function Toggle({
  checked,
  onClick,
  label,
  disabled,
}: {
  checked: boolean;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`${styles.toggle} ${checked ? styles.toggleOn : ""}`}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
    >
      <span />
    </button>
  );
}

/** Single-choice buttons; the chosen one is aria-pressed. */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | null | undefined;
  options: readonly (readonly [T, string])[];
  onChange: (value: T) => void;
}) {
  return (
    <div className={styles.segmented} role="group" aria-label={label}>
      {options.map(([option, text]) => (
        <button
          key={option}
          type="button"
          className={value === option ? styles.active : ""}
          aria-pressed={value === undefined ? undefined : value === option}
          onClick={() => onChange(option)}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

export function Status({ message }: { message: string }) {
  return (
    <p className={styles.status} aria-live="polite">
      {message}
    </p>
  );
}
