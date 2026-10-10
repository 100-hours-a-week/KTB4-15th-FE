import { RankingScreen } from "@/features/ranking";
import { Header } from "@/shared/ui/header/header";
import { HeaderTitle } from "@/shared/ui/header/header-title";
import styles from "./page.module.scss";

export default function RankingPage() {
  return (
    <>
      <Header left={<HeaderTitle>랭킹</HeaderTitle>} />
      <main className={styles.main}>
        <RankingScreen />
      </main>
    </>
  );
}
