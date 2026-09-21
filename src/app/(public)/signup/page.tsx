import { Header, HeaderIconLink } from "@/shared/ui/header";
import { BackIcon } from "@/shared/ui/icon";
import { IntroHero } from "@/shared/ui/intro-hero/intro-hero";
import { SignupForm } from "@/features/signup/signup-form";
import styles from "./page.module.scss";

export default function SignupPage() {
  return (
    <>
      <Header
        left={
          <HeaderIconLink aria-label="로그인으로 돌아가기" href="/login">
            <BackIcon />
          </HeaderIconLink>
        }
      />
      <main className={styles.main}>
        <IntroHero
          description={
            "옷 고를 시간 없는 사람들을 위해\n필요한 옷만 빠르게 찾아드려요."
          }
          title={"나만의 AI 스타일리스트\n계정 만들기"}
        />
        <SignupForm />
      </main>
    </>
  );
}
