import Link from "next/link";
import { t } from "@/i18n";
import styles from "./terms-choice.module.css";

export function TermsChoice({ defaultAgreed = true }: { defaultAgreed?: boolean }) {
  return (
    <div className={styles.choice}>
      <label>
        <input type="checkbox" name="terms" value="agree" defaultChecked={defaultAgreed} />
        <span>{t("terms.agree")}</span>
      </label>
      <p>
        <Link href="/terms" target="_blank" rel="noopener noreferrer">
          {t("terms.title")}
        </Link>
        {" · "}
        <Link href="/privacy" target="_blank" rel="noopener noreferrer">
          {t("privacy.title")}
        </Link>
      </p>
      <p>{t("terms.choiceHint")}</p>
    </div>
  );
}
