import type { FormState } from "./actions";
import styles from "./admin.module.css";

export function FieldError({ state, name }: { state: FormState; name: string }) {
  const message = state.fieldErrors?.[name]?.[0];
  return message ? <span className={styles.error}>{message}</span> : null;
}

export function FormNotice({ state }: { state: FormState }) {
  if (state.message)
    return (
      <p className={styles.notice} role="status">
        {state.message}
      </p>
    );
  if (state.fieldErrors) {
    return (
      <p className={`${styles.notice} ${styles.noticeError}`} role="alert">
        有欄位需要修正，請檢查標示的項目。
      </p>
    );
  }
  return null;
}
