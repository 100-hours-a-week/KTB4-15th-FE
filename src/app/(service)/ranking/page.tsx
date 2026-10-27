import { RankingScreen } from "@/features/ranking";
import { getProductRankingsServer } from "@/features/ranking/api/ranking-server";
import { RANKING_RENDER_BATCH_SIZE } from "@/features/ranking/schema/ranking";
import { RankingRow } from "@/features/ranking/ui/ranking-row";
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
  const firstImageProductId = initialRanking?.items.find(
    (product) => product.productImageUrl,
  )?.productId;

  return (
    <>
      <Header
        left={<HeaderTitle>랭킹</HeaderTitle>}
        right={<NotificationLink />}
      />
      <main className={styles.main}>
        <RankingScreen
          initialRanking={initialRanking}
          initialRows={initialRanking?.items
            .slice(0, RANKING_RENDER_BATCH_SIZE)
            .map((product) => (
              <RankingRow
                key={product.productId}
                preload={product.productId === firstImageProductId}
                product={product}
                rank={product.rank}
                rankingType={initialRanking.type}
              />
            ))}
        />
      </main>
    </>
  );
}
