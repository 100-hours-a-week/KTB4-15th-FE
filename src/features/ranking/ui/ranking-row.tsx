import Image, { type ImageLoaderProps } from "next/image";
import { useState } from "react";
import { ImageViewerDialog } from "@/shared/ui/dialog";
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
  const [isImageOpen, setIsImageOpen] = useState(false);

  return (
    <article className={styles.row}>
      <strong className={styles.rank}>{rank}</strong>
      {imageFailed ? (
        <span className={styles.imageArea}>
          <span aria-label="상품 이미지 없음" className={styles.imageFallback}>
            <ProductFallbackIcon />
          </span>
        </span>
      ) : (
        <button
          aria-label={`${product.productName} 이미지 확대`}
          className={`${styles.imageArea} ${styles.imageButton}`}
          onClick={() => setIsImageOpen(true)}
          type="button"
        >
          <Image
            alt=""
            className={styles.image}
            fill
            loader={passthroughImageLoader}
            onError={() => setImageFailed(true)}
            sizes="80px"
            src={product.productImageUrl}
          />
        </button>
      )}
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
      {!imageFailed && (
        <ImageViewerDialog
          alt={product.productName}
          onError={() => setImageFailed(true)}
          onOpenChange={setIsImageOpen}
          open={isImageOpen}
          src={product.productImageUrl}
        />
      )}
    </article>
  );
}
