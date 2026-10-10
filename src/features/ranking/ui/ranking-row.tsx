import Image, { type ImageLoaderProps } from "next/image";
import { useState } from "react";
import { BottomIcon, EyeIcon, HeartIcon, TopIcon } from "@/shared/ui/icon";
import { formatCompactNumber } from "@/shared/utils/number-format";
import { formatPrice } from "@/shared/utils/price-format";
import type { RankingProduct, RankingType } from "../schema/ranking";
import styles from "./ranking-row.module.scss";

function passthroughImageLoader({ src }: ImageLoaderProps) {
  return src;
}

type RankingRowProps = {
  product: RankingProduct;
  rank: number;
  rankingType: RankingType;
};

export function RankingRow({ product, rank, rankingType }: RankingRowProps) {
  const ProductFallbackIcon = product.itemType === "TOP" ? TopIcon : BottomIcon;
  const count = formatCompactNumber(product.rankingCount);
  const isWishRanking = rankingType === "WISH";
  const [imageFailed, setImageFailed] = useState(!product.productImageUrl);

  return (
    <article className={styles.row}>
      <strong className={styles.rank}>{rank}</strong>
      <span className={styles.imageArea}>
        {imageFailed ? (
          <span aria-label="상품 이미지 없음" className={styles.imageFallback}>
            <ProductFallbackIcon />
          </span>
        ) : (
          <Image
            alt=""
            className={styles.image}
            fill
            loader={passthroughImageLoader}
            onError={() => setImageFailed(true)}
            sizes="80px"
            src={product.productImageUrl}
          />
        )}
      </span>
      <a
        aria-label={`${product.productName} 구매 페이지로 이동`}
        className={styles.productLink}
        href={product.purchaseUrl}
        rel="noopener noreferrer"
        target="_blank"
      >
        <strong className={styles.name}>{product.productName}</strong>
        {product.color && <span className={styles.color}>{product.color}</span>}
        <span className={styles.price}>
          {formatPrice(product.currentPrice)}
        </span>
      </a>
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
