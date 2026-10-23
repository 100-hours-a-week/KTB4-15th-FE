import { BottomIcon, TopIcon } from "@/shared/ui/icon";
import { formatPrice } from "@/shared/utils/price-format";
import { getPriceChangeText } from "../lib/wishlist-display";
import type { WishlistItem } from "../schema/wishlist";
import {
  WishlistImage,
  WishlistProductLink,
  WishlistToggle,
} from "./wishlist-card-actions";
import styles from "./wishlist-card.module.scss";

export function WishlistCard({
  preload = false,
  product,
}: {
  preload?: boolean;
  product: WishlistItem;
}) {
  const ProductFallbackIcon = product.itemType === "TOP" ? TopIcon : BottomIcon;
  const priceChanged = product.wishedPrice !== product.currentPrice;
  const priceDecreased = product.currentPrice < product.wishedPrice;

  return (
    <article className={styles.card}>
      <WishlistImage
        fallback={<ProductFallbackIcon />}
        preload={preload}
        product={product}
      />
      <WishlistProductLink
        className={styles.productLink}
        productId={product.productId}
        productName={product.productName}
        purchaseUrl={product.purchaseUrl}
      >
        <span className={styles.details}>
          <strong>{product.productName}</strong>
          {priceChanged && (
            <del>찜 당시 가격 {formatPrice(product.wishedPrice)}</del>
          )}
          <span
            className={`${styles.currentPrice} ${priceDecreased ? styles.priceDecreased : ""}`}
          >
            {formatPrice(product.currentPrice)}
            {priceChanged && (
              <em>
                {getPriceChangeText(
                  product.priceChangeRate,
                  product.wishedPrice,
                  product.currentPrice,
                )}
              </em>
            )}
          </span>
        </span>
      </WishlistProductLink>
      <WishlistToggle className={styles.deleteButton} product={product} />
    </article>
  );
}
