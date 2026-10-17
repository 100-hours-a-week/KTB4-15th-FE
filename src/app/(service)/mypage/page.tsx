import { FittingResultSection } from "@/features/fitting";
import { AccountSection, MemberProfileSection } from "@/features/profile";
import { Header, HeaderTitle, NotificationLink } from "@/shared/ui/header";
import styles from "./page.module.scss";

export default function MyPage() {
  return (
    <>
      <Header
        left={<HeaderTitle>마이</HeaderTitle>}
        right={<NotificationLink />}
      />
      <main className={styles.main}>
        <MemberProfileSection />
        <FittingResultSection />
        <AccountSection />
      </main>
    </>
  );
}
