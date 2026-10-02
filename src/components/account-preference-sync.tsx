"use client";

import { useEffect } from "react";
import type { ReaderPreferences } from "@/server/services/reader-account";
import {
  enableAccountSync,
  loadPrefs,
  normalizePrefs,
  type ReaderPrefs,
  setLocalPrefs,
  syncPrefs,
} from "./reader-prefs";

export function localFromServer(preferences: ReaderPreferences): ReaderPrefs {
  return normalizePrefs({
    theme: preferences.readerTheme,
    size: preferences.readerFontSize,
    font: preferences.readerFont,
    palette: preferences.sitePalette,
    lineHeight: preferences.lineHeight,
    pageWidth: preferences.pageWidth,
    readingMode: preferences.readingMode,
    siteTheme: preferences.siteTheme,
    worksView: preferences.worksView,
    directoryOrder: preferences.directoryOrder,
  });
}

/** Signed-in readers: server preferences win; a first sign-in uploads this device's prefs. */
export function AccountPreferenceSync({
  preferences,
  exists,
}: {
  preferences: ReaderPreferences;
  exists: boolean;
}) {
  useEffect(() => {
    enableAccountSync();
    if (exists) {
      const server = localFromServer(preferences);
      // A reading mode chosen on this device before signing in fills a server gap.
      const local = loadPrefs();
      if (server.readingMode === null && local.readingMode !== null) {
        setLocalPrefs({ ...server, readingMode: local.readingMode });
        void syncPrefs({ readingMode: local.readingMode });
      } else {
        setLocalPrefs(server);
      }
    } else {
      void syncPrefs(loadPrefs());
    }
  }, [exists, preferences]);

  return null;
}
