import { ProfileSetupForm } from "@/features/profile/profile-setup-form";
import { Header } from "@/shared/ui/header";
import { IntroHero } from "@/shared/ui/intro-hero";
import styles from "./page.module.scss";

export default function ProfileSetupPage() {
  return (
    <>
      <Header />
      <main className={styles.main}>
        <IntroHero
          description="더 나은 추천을 위해 기본 정보를 입력해 주세요."
          size="compact"
          title="기본 정보 입력"
        />
        <ProfileSetupForm />
      </main>
    </>
  );
}
