"use client";

import { useState } from "react";
import { t } from "@/i18n";
import { READER_LINE_HEIGHT, READER_PAGE_WIDTH, READER_SIZE } from "../reader-prefs";
import { Group, Row, Segmented, Status, usePrefSettings } from "./controls";
import styles from "./settings.module.css";

/** Reading mode and the reader's typography; works for visitors (this device) and members. */
export function ReadingSettings({ signedIn }: { signedIn: boolean }) {
  const { prefs, update, message } = usePrefSettings(signedIn);
  // Sliders preview while dragging and save on release.
  const [lineHeight, setLineHeight] = useState<number | null>(null);
  const [pageWidth, setPageWidth] = useState<number | null>(null);
  const size = prefs?.size ?? READER_SIZE.default;
  const shownLineHeight = lineHeight ?? prefs?.lineHeight ?? READER_LINE_HEIGHT.default;
  const shownPageWidth = pageWidth ?? prefs?.pageWidth ?? READER_PAGE_WIDTH.default;

  return (
    <div className={styles.stack}>
      <Group id="reading-mode" title={t("settings.readingMode")}>
        <Row label={t("settings.readingMode")} hint={t("settings.readingModeHint")}>
          <Segmented
            label={t("settings.readingMode")}
            value={prefs?.readingMode}
            options={[
              ["paged", t("readingMode.paged")],
              ["continuous", t("readingMode.continuous")],
            ]}
            onChange={(readingMode) => void update({ readingMode })}
          />
        </Row>
      </Group>
      <Group id="reading-type" title={t("settings.typography")}>
        <Row label={t("account.fontSize")}>
          <div className={styles.stepper}>
            <button
              type="button"
              aria-label={t("reader.fontSmaller")}
              onClick={() => void update({ size: size - 1 })}
            >
              A−
            </button>
            <output aria-live="polite">{size}px</output>
            <button
              type="button"
              aria-label={t("reader.fontLarger")}
              onClick={() => void update({ size: size + 1 })}
            >
              A＋
            </button>
          </div>
        </Row>
        <Row label={t("account.theme")}>
          <Segmented
            label={t("account.theme")}
            value={prefs?.theme}
            options={[
              ["sepia", t("account.sepia")],
              ["white", t("account.white")],
              ["dark", t("account.dark")],
            ]}
            onChange={(theme) => void update({ theme })}
          />
        </Row>
        <Row label={t("account.font")}>
          <Segmented
            label={t("account.font")}
            value={prefs?.font}
            options={[
              ["serif", t("account.serif")],
              ["sans", t("account.sans")],
            ]}
            onChange={(font) => void update({ font })}
          />
        </Row>
        <label className={styles.range}>
          <span>{t("account.lineHeight")}</span>
          <input
            type="range"
            min={READER_LINE_HEIGHT.min}
            max={READER_LINE_HEIGHT.max}
            step="5"
            value={shownLineHeight}
            onChange={(event) => setLineHeight(Number(event.target.value))}
            onPointerUp={() =>
              void update({ lineHeight: shownLineHeight }).then(() => setLineHeight(null))
            }
            onKeyUp={() =>
              void update({ lineHeight: shownLineHeight }).then(() => setLineHeight(null))
            }
          />
          <output>{(shownLineHeight / 100).toFixed(2)}</output>
        </label>
        <label className={styles.range}>
          <span>{t("account.pageWidth")}</span>
          <input
            type="range"
            min={READER_PAGE_WIDTH.min}
            max={READER_PAGE_WIDTH.max}
            step="20"
            value={shownPageWidth}
            onChange={(event) => setPageWidth(Number(event.target.value))}
            onPointerUp={() =>
              void update({ pageWidth: shownPageWidth }).then(() => setPageWidth(null))
            }
            onKeyUp={() =>
              void update({ pageWidth: shownPageWidth }).then(() => setPageWidth(null))
            }
          />
          <output>{shownPageWidth}px</output>
        </label>
      </Group>
      <Status message={message} />
    </div>
  );
}
