"use client";

import { useEffect, useState } from "react";
import { loadPrefs, PREFS_EVENT, type ReaderPrefs } from "./reader-prefs";

/** Device preferences after hydration (null before), kept current across components. */
export function usePrefs() {
  const [prefs, setPrefs] = useState<ReaderPrefs | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read device prefs after hydration
    setPrefs(loadPrefs());
    const onChange = (event: Event) => setPrefs((event as CustomEvent<ReaderPrefs>).detail);
    window.addEventListener(PREFS_EVENT, onChange);
    return () => window.removeEventListener(PREFS_EVENT, onChange);
  }, []);
  return prefs;
}
