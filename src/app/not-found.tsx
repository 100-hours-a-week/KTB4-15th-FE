import Link from "next/link";
import styles from "./global-error.module.scss";

export default function NotFound() {
  return (
    <main className={styles.main}>
      <section className={styles.card}>
        <h1 className={styles.title}>페이지를 찾을 수 없어요</h1>
        <p className={styles.description}>
          주소가 잘못되었거나 페이지가 이동되었을 수 있어요.
        </p>
        <Link className={styles.button} href="/chat">
          서비스로 돌아가기
        </Link>
      </section>
    </main>
  );
}
