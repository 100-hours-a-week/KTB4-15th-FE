import { AccountSection, MemberProfileSection } from "@/features/profile";
import { Header, HeaderTitle } from "@/shared/ui/header";
import styles from "./page.module.scss";

export default function MyPage() {
  return (
    <>
      <Header left={<HeaderTitle>마이</HeaderTitle>} />
      <main className={styles.main}>
        <MemberProfileSection />
        <AccountSection />
      </main>
    </>
  );
}
