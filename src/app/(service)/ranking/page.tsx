import { RankingScreen } from "@/features/ranking";
import { Header, HeaderTitle, NotificationLink } from "@/shared/ui/header";
import styles from "./page.module.scss";

export default function RankingPage() {
  return (
    <>
      <Header
        left={<HeaderTitle>랭킹</HeaderTitle>}
        right={<NotificationLink />}
      />
      <main className={styles.main}>
        <RankingScreen />
      </main>
    </>
  );
}
