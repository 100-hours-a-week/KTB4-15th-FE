import { Header } from "@/shared/ui/header";
import styles from "./page.module.scss";

export default function LoginPage() {
  return (
    <>
      <Header />
      <main className={styles.page}>
        <h1>로그인</h1>
        <p>로그인 화면입니다.</p>
      </main>
    </>
  );
}
