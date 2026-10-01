import styles from "./admin.module.css";

// Suspense boundary for every admin page: navigation shows this instantly while
// the session check and database reads stream in.
export default function AdminLoading() {
  return (
    <p className={styles.subtle} role="status">
      載入中…
    </p>
  );
}
