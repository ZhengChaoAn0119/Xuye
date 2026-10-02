"use client";

import { useActionState, useEffect } from "react";
import { updateQuotaSettingsAction, type FormState } from "../actions";
import styles from "../admin.module.css";
import { FieldError, FormNotice } from "../form-status";
import { useUnsavedChanges } from "../use-unsaved-changes";

export function QuotaForm({ visitor, free }: { visitor: number; free: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    updateQuotaSettingsAction,
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
          <label htmlFor="visitor">訪客章數／24 小時</label>
          <input
            id="visitor"
            name="visitor"
            type="number"
            min="1"
            max="10000"
            defaultValue={visitor}
            className={styles.input}
            required
          />
          <FieldError state={state} name="visitor" />
        </div>
        <div className={styles.field}>
          <label htmlFor="free">免費會員章數／24 小時</label>
          <input
            id="free"
            name="free"
            type="number"
            min="1"
            max="10000"
            defaultValue={free}
            className={styles.input}
            required
          />
          <FieldError state={state} name="free" />
        </div>
      </div>
      <p className={styles.hint}>
        視窗從讀者第一次計費的章節開始滾動 24 小時；修改後立即套用到新舊有效視窗。
      </p>
      <div className={styles.actions}>
        <button type="submit" className={`${styles.button} ${styles.primary}`} disabled={pending}>
          {pending ? "儲存中…" : "儲存額度設定"}
        </button>
      </div>
    </form>
  );
}
