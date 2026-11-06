import { formatPrice } from "@/shared/utils/price-format";
import { BottomIcon, TopIcon } from "@/shared/ui/icon";
import type { FittingCandidate } from "../../schema/fitting-candidate";
import {
  CandidateImage,
  CandidateSelectButton,
} from "./fitting-wardrobe-card-actions";
import styles from "./fitting-wardrobe-card.module.scss";

export function CandidateCard({
  priority,
  product,
}: {
  priority: boolean;
  product: FittingCandidate;
}) {
  const ProductFallbackIcon = product.itemType === "TOP" ? TopIcon : BottomIcon;

  return (
    <CandidateSelectButton product={product}>
      <CandidateImage
        fallback={<ProductFallbackIcon />}
        priority={priority}
        src={product.productImageUrl}
      />
      <span className={styles.productDetails}>
        <small>{product.color}</small>
        <strong>{product.productName}</strong>
        <b>{formatPrice(product.currentPrice)}</b>
      </span>
    </CandidateSelectButton>
  );
}
