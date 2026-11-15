import rankingStyles from "@/features/ranking/ui/ranking-screen.module.scss";
import { RankingSkeleton } from "@/features/ranking/ui/ranking-skeleton";
import { Header, HeaderTitle, NotificationLink } from "@/shared/ui/header";
import styles from "../page-layout.module.scss";

export default function RankingLoading() {
  return (
    <>
      <Header
        left={<HeaderTitle>랭킹</HeaderTitle>}
        right={<NotificationLink />}
      />
      <main className={styles.main}>
        <div
          aria-hidden="true"
          className={rankingStyles.tabs}
          data-selected="WISH"
        >
          <button
            className={rankingStyles.tab}
            aria-pressed="true"
            disabled
            type="button"
          >
            찜순
          </button>
          <button className={rankingStyles.tab} disabled type="button">
            조회순
          </button>
        </div>
        <RankingSkeleton />
      </main>
    </>
  );
}
