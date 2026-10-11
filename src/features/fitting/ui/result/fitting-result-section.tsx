import Link from "next/link";
import styles from "./fitting-result-section.module.scss";

export function FittingResultSection() {
  return (
    <section aria-labelledby="fitting-menu-title" className={styles.card}>
      <h2 className={styles.title} id="fitting-menu-title">
        나의 활동
      </h2>
      <Link className={styles.link} href="/fitting-results">
        <span>가상 피팅 저장 목록</span>
      </Link>
    </section>
  );
}
