import { LoginForm, SessionExpiredToast } from "@/features/auth";
import { IntroHero } from "@/shared/ui/intro-hero";
import { normalizeReturnTo } from "@/app/bff/auth/_lib/return-to";
import styles from "./page.module.scss";

export const metadata = {
  title: "로그인 | LOOK DDAK",
};

type LoginPageProps = {
  searchParams: Promise<{ reason?: string; returnTo?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { reason, returnTo } = await searchParams;

  return (
    <main className={styles.main}>
      <IntroHero
        description={
          "옷 고를 시간 없는 사람들을 위해\n필요한 옷만 빠르게 찾아드려요."
        }
        title={"패션이 쉬워지는\nAI 도우미 룩딱"}
      />
      <SessionExpiredToast enabled={reason === "session-expired"} />
      <LoginForm returnTo={normalizeReturnTo(returnTo)} />
    </main>
  );
}
