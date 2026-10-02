"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { updateWorkAction, type FormState } from "../../actions";
import styles from "../../admin.module.css";
import { FieldError, FormNotice } from "../../form-status";
import { useUnsavedChanges } from "../../use-unsaved-changes";

type WorkFormProps = {
  workId: number;
  defaults: {
    title: string;
    authorName: string;
    synopsis: string;
    status: "ongoing" | "completed";
    hasSexual: boolean;
    hasViolence: boolean;
    tags: string[];
  };
};

export function WorkForm({ workId, defaults }: WorkFormProps) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    updateWorkAction.bind(null, workId),
    {},
  );
  const { markDirty, markClean } = useUnsavedChanges();
  useEffect(() => {
    if (state.ok) markClean();
  }, [markClean, state.ok]);
  return (
    <form action={action} className={styles.form} onChange={markDirty}>
      <FormNotice state={state} />
      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="title">書名</label>
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
          <label htmlFor="authorName">作者</label>
          <input
            id="authorName"
            name="authorName"
            className={styles.input}
            defaultValue={defaults.authorName}
          />
          <FieldError state={state} name="authorName" />
        </div>
        <div className={styles.field}>
          <label htmlFor="status">連載狀態</label>
          <select
            id="status"
            name="status"
            className={styles.select}
            defaultValue={defaults.status}
          >
            <option value="ongoing">連載中</option>
            <option value="completed">已完結</option>
          </select>
        </div>
      </div>
      <div className={styles.field}>
        <label htmlFor="synopsis">簡介</label>
        <textarea
          id="synopsis"
          name="synopsis"
          className={styles.textarea}
          defaultValue={defaults.synopsis}
        />
        <FieldError state={state} name="synopsis" />
      </div>
      <div className={styles.field}>
        <label htmlFor="tags">分類標籤</label>
        <input
          id="tags"
          name="tags"
          className={styles.input}
          defaultValue={defaults.tags.join("、")}
          placeholder="例如：同人、穿越、日常"
        />
        <span className={styles.hint}>以頓號或逗號分隔，最多 20 個。</span>
      </div>
      <fieldset className={styles.checks}>
        <legend className={styles.legend}>內容分級</legend>
        <label>
          <input type="checkbox" name="hasSexual" defaultChecked={defaults.hasSexual} /> 含性描繪
        </label>
        <label>
          <input type="checkbox" name="hasViolence" defaultChecked={defaults.hasViolence} />{" "}
          含暴力血腥
        </label>
      </fieldset>
      <div className={styles.actions}>
        <button type="submit" className={`${styles.button} ${styles.primary}`} disabled={pending}>
          {pending ? "儲存中…" : "儲存作品資料"}
        </button>
        <Link className={styles.button} href="/admin/works">
          取消
        </Link>
      </div>
    </form>
  );
}
