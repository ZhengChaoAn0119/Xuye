"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ImportSummary } from "@/app/api/admin/import/route";
import styles from "../admin.module.css";

type Result = { summary: ImportSummary; workId?: number };

export function ImportPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"preview" | "apply" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // A file picked before hydration fires no React onChange; pick it up on mount.
  useEffect(() => {
    const picked = inputRef.current?.files?.[0];
    if (picked) setFile(picked);
  }, []);

  async function send(apply: boolean) {
    if (!file) return;
    setBusy(apply ? "apply" : "preview");
    setError(null);
    const body = new FormData();
    body.set("file", file);
    try {
      const response = await fetch(`/api/admin/import${apply ? "?apply=1" : ""}`, {
        method: "POST",
        body,
      });
      const data = (await response.json().catch(() => ({}))) as Partial<Result> & {
        error?: string;
      };
      if (!response.ok || !data.summary) {
        setError(data.error ?? `匯入失敗（HTTP ${response.status}）`);
        setResult(null);
      } else {
        setResult(data as Result);
      }
    } catch {
      setError("無法連線到伺服器");
    } finally {
      setBusy(null);
    }
  }

  const summary = result?.summary;
  const applied = result?.workId !== undefined;
  const nothingToDo =
    summary && summary.inserts === 0 && summary.updates === 0 && summary.workId !== null;

  return (
    <div className={styles.form}>
      <div className={styles.field}>
        <label htmlFor="epub">EPUB 檔案</label>
        <input
          id="epub"
          ref={inputRef}
          type="file"
          accept=".epub,application/epub+zip"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setResult(null);
            setError(null);
          }}
        />
        <span className={styles.hint}>
          同一部作品（以書名比對）重複匯入時，只會新增後面的章節、更新內容有變的章節；不會刪除章節，也不會覆蓋後台改過的類型與狀態。
        </span>
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.button}
          disabled={!file || busy !== null}
          onClick={() => send(false)}
        >
          {busy === "preview" ? "分析中…" : "預覽"}
        </button>
        {summary && !applied && !nothingToDo && (
          <button
            type="button"
            className={`${styles.button} ${styles.primary}`}
            disabled={busy !== null}
            onClick={() => send(true)}
          >
            {busy === "apply" ? "匯入中…" : "確認匯入（立即發布新章節）"}
          </button>
        )}
      </div>

      {error && (
        <p className={`${styles.notice} ${styles.noticeError}`} role="alert">
          {error}
        </p>
      )}

      {summary && (
        <section className={styles.panel} aria-live="polite">
          <h2 className={styles.panelTitle}>{applied ? "匯入完成" : "預覽結果"}</h2>
          <p>{summary.description}</p>
          <ul className={styles.planList}>
            {summary.firstNew && (
              <li>
                新增範圍：{summary.firstNew} ～ {summary.lastNew}
              </li>
            )}
            {summary.notes.length > 0 && <li>判定為作者公告：{summary.notes.join("、")}</li>}
            {summary.hidden.length > 0 && <li>內文缺漏、將隱藏：{summary.hidden.join("、")}</li>}
            {summary.missingFromFile.length > 0 && (
              <li>
                資料庫有、檔案沒有的章節位置：{summary.missingFromFile.join("、")}（不會刪除）
              </li>
            )}
            {nothingToDo && <li>沒有需要匯入的變更。</li>}
          </ul>
          {applied && (
            <p>
              <Link
                href={`/admin/works/${result!.workId}`}
                className={`${styles.button} ${styles.primary}`}
              >
                前往作品
              </Link>
            </p>
          )}
        </section>
      )}
    </div>
  );
}
