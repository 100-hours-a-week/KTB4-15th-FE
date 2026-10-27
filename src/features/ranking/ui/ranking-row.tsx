import { BottomIcon, EyeIcon, HeartIcon, TopIcon } from "@/shared/ui/icon";
import { formatCompactNumber } from "@/shared/utils/number-format";
import { formatPrice } from "@/shared/utils/price-format";
import type { RankingProduct, RankingType } from "../schema/ranking";
import { RankingImage, RankingProductLink } from "./ranking-row-actions";
import styles from "./ranking-row.module.scss";

type RankingRowProps = {
  preload?: boolean;
  product: RankingProduct;
  rank: number;
  rankingType: RankingType;
};

export function RankingRow({
  preload = false,
  product,
  rank,
  rankingType,
}: RankingRowProps) {
  const ProductFallbackIcon = product.itemType === "TOP" ? TopIcon : BottomIcon;
  const count = formatCompactNumber(product.rankingCount);
  const isWishRanking = rankingType === "WISH";

  return (
    <article className={styles.row}>
      <strong className={styles.rank}>{rank}</strong>
      <RankingImage
        fallback={<ProductFallbackIcon />}
        name={product.productName}
        preload={preload}
        src={product.productImageUrl}
      />
      <RankingProductLink
        name={product.productName}
        productId={product.productId}
        url={product.purchaseUrl}
      >
        <strong className={styles.name}>{product.productName}</strong>
        {product.color && <span className={styles.color}>{product.color}</span>}
        <span className={styles.price}>
          {formatPrice(product.currentPrice)}
        </span>
      </RankingProductLink>
      <span
        aria-label={`${isWishRanking ? "찜" : "조회"} ${count}`}
        className={`${styles.count} ${isWishRanking ? styles.wishCount : ""}`}
      >
        {isWishRanking ? <HeartIcon filled /> : <EyeIcon />}
        {count}
      </span>
    </article>
  );
}
