import { RankingScreen } from "@/features/ranking";
import { getProductRankingsServer } from "@/features/ranking/api/ranking-server";
import {
  isServerUnauthorizedError,
  redirectOnServerUnauthorized,
} from "@/shared/api/server";
import { Header, HeaderTitle, NotificationLink } from "@/shared/ui/header";
import styles from "../page-layout.module.scss";

export default async function RankingPage() {
  const initialRanking = await getProductRankingsServer("WISH").catch(
    (error: unknown) => {
      if (isServerUnauthorizedError(error)) {
        return redirectOnServerUnauthorized(error);
      }
    },
  );

  return (
    <>
      <Header
        left={<HeaderTitle>랭킹</HeaderTitle>}
        right={<NotificationLink />}
      />
      <main className={styles.main}>
        <RankingScreen initialRanking={initialRanking} />
      </main>
    </>
  );
}
