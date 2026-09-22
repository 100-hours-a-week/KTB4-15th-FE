import { LoginForm } from "@/features/auth";
import { IntroHero } from "@/shared/ui/intro-hero";
import styles from "./page.module.scss";

export default function LoginPage() {
  return (
    <main className={styles.main}>
      <IntroHero
        description={
          "옷 고를 시간 없는 사람들을 위해\n필요한 옷만 빠르게 찾아드려요."
        }
        title={"패션이 쉬워지는\nAI 도우미 룩딱"}
      />
      <LoginForm />
    </main>
  );
}
