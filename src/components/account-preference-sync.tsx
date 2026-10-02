"use client";

import { useEffect } from "react";
import type { ReaderPreferences } from "@/server/services/reader-account";
import {
  applyPrefs,
  normalizePrefs,
  PALETTE_EVENT,
  READER_PREFS_KEY,
  type ReaderPrefs,
} from "./reader-prefs";

function localFromServer(preferences: ReaderPreferences): ReaderPrefs {
  return normalizePrefs({
    theme: preferences.readerTheme,
    size: preferences.readerFontSize,
    font: preferences.readerFont,
    palette: preferences.sitePalette,
    lineHeight: preferences.lineHeight,
    pageWidth: preferences.pageWidth,
    autoNext: preferences.autoNextChapter,
  });
}

function serverFromLocal(preferences: ReaderPrefs) {
  return {
    readerTheme: preferences.theme,
    readerFontSize: preferences.size,
    readerFont: preferences.font,
    sitePalette: preferences.palette,
    lineHeight: preferences.lineHeight,
    pageWidth: preferences.pageWidth,
    autoNextChapter: preferences.autoNext,
  };
}

export function AccountPreferenceSync({
  preferences,
  exists,
}: {
  preferences: ReaderPreferences;
  exists: boolean;
}) {
  useEffect(() => {
    try {
      if (exists) {
        const local = localFromServer(preferences);
        localStorage.setItem(READER_PREFS_KEY, JSON.stringify(local));
        applyPrefs(local);
        window.dispatchEvent(new CustomEvent(PALETTE_EVENT, { detail: local.palette }));
      } else {
        const local = normalizePrefs(JSON.parse(localStorage.getItem(READER_PREFS_KEY) ?? "{}"));
        void fetch("/api/v1/me/preferences", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(serverFromLocal(local)),
        });
      }
    } catch {
      // Private browsing or blocked storage: server preferences remain authoritative.
    }
  }, [exists, preferences]);

  return null;
}
