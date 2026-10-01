"use client";

import { useActionState, useState } from "react";
import type { FormState } from "./actions";
import styles from "./admin.module.css";
import { FieldError, FormNotice } from "./form-status";

type Mode = "now" | "schedule" | "draft" | "hidden" | "keep";

type ChapterFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaults: { title: string; kind: "chapter" | "note"; body: string; publishAt: string };
  /** Edit forms offer "keep current state"; new chapters default to publishing now. */
  isEdit: boolean;
  submitLabel: string;
};

const modeLabels: Record<Mode, string> = {
  keep: "維持目前狀態",
  now: "立即發布",
  schedule: "排程發布",
  draft: "存為草稿",
  hidden: "隱藏",
};

export function ChapterForm({ action, defaults, isEdit, submitLabel }: ChapterFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const [mode, setMode] = useState<Mode>(isEdit ? "keep" : "now");
  const modes: Mode[] = isEdit
    ? ["keep", "now", "schedule", "draft", "hidden"]
    : ["now", "schedule", "draft"];

  return (
    <form action={formAction} className={styles.form}>
      <FormNotice state={state} />
      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="title">章節標題</label>
          <input
            id="title"
            name="title"
            className={styles.input}
            defaultValue={defaults.title}
            required
          />
          <FieldError state={state} name="title" />
        </div>
        <div className={styles.field}>
          <label htmlFor="kind">類型</label>
          <select id="kind" name="kind" className={styles.select} defaultValue={defaults.kind}>
            <option value="chapter">正文</option>
            <option value="note">作者公告（不計閱讀額度）</option>
          </select>
        </div>
      </div>
      <div className={styles.field}>
        <label htmlFor="body">內文</label>
        <textarea
          id="body"
          name="body"
          className={`${styles.textarea} ${styles.bodyTextarea}`}
          defaultValue={defaults.body}
          required
        />
        <span className={styles.hint}>
          每一行是一個段落。開頭的全形空白會自動移除，排版由閱讀器處理。
        </span>
        <FieldError state={state} name="body" />
      </div>
      <fieldset className={styles.field}>
        <legend className={styles.legend}>發布方式</legend>
        <div className={styles.checks}>
          {modes.map((m) => (
            <label key={m}>
              <input
                type="radio"
                name="publishMode"
                value={m}
                checked={mode === m}
                onChange={() => setMode(m)}
              />
              {modeLabels[m]}
            </label>
          ))}
        </div>
        {mode === "schedule" && (
          <div className={styles.field}>
            <label htmlFor="publishAt">發布時間（台北時間）</label>
            <input
              id="publishAt"
              name="publishAt"
              type="datetime-local"
              className={styles.input}
              defaultValue={defaults.publishAt}
              required
            />
            <FieldError state={state} name="publishAt" />
          </div>
        )}
      </fieldset>
      <div className={styles.actions}>
        <button type="submit" className={`${styles.button} ${styles.primary}`} disabled={pending}>
          {pending ? "處理中…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
