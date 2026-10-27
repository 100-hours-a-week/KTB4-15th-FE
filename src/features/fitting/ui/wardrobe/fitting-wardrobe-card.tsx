"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductItemType } from "@/shared/schema/product";
import { formatPrice } from "@/shared/utils/price-format";
import { BottomIcon, CheckIcon, TopIcon } from "@/shared/ui/icon";
import type { FittingCandidate } from "../../schema/fitting-candidate";
import { useFittingSelectionStore } from "../../store/fitting-selection-store";
import styles from "./fitting-wardrobe-card.module.scss";

type CandidateCardProps = {
  priority: boolean;
  isEditing: boolean;
  isSelectedForDelete: boolean;
  onToggleDelete: (candidateId: number) => void;
  product: FittingCandidate;
};

export function CandidateCard({
  priority,
  isEditing,
  isSelectedForDelete,
  onToggleDelete,
  product,
}: CandidateCardProps) {
  const [imageFailed, setImageFailed] = useState(!product.productImageUrl);
  const ProductFallbackIcon = product.itemType === "TOP" ? TopIcon : BottomIcon;
  const selectedProductId = useFittingSelectionStore((state) =>
    product.itemType === "TOP" ? state.top?.productId : state.bottom?.productId,
  );
  const selectProduct = useFittingSelectionStore(
    (state) => state.selectProduct,
  );
  const isSelected = isEditing
    ? isSelectedForDelete
    : selectedProductId === product.productId;

  return (
    <button
      aria-pressed={isSelected}
      className={`${styles.productCard} ${isSelected ? (isEditing ? styles.selectedForDelete : styles.selected) : ""}`}
      onClick={() =>
        isEditing
          ? onToggleDelete(product.fittingCandidateId)
          : selectProduct(product)
      }
      type="button"
    >
      <span
        aria-label={imageFailed ? "상품 이미지 없음" : undefined}
        className={`${styles.imageArea} ${imageFailed ? styles.emptyImageArea : ""}`}
      >
        {imageFailed ? (
          <ProductFallbackIcon />
        ) : (
          <Image
            alt=""
            className={styles.productImage}
            fill
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : undefined}
            onError={() => setImageFailed(true)}
            sizes="72px"
            src={product.productImageUrl}
          />
        )}
      </span>
      <span className={styles.productDetails}>
        <small>{product.color}</small>
        <strong>{product.productName}</strong>
        <b>{formatPrice(product.currentPrice)}</b>
      </span>
      <span aria-hidden="true" className={styles.selectionMark}>
        {isSelected && <CheckIcon />}
      </span>
    </button>
  );
}

export function EmptyCandidateCard({
  itemType,
}: {
  itemType: ProductItemType;
}) {
  const selectedProduct = useFittingSelectionStore((state) =>
    itemType === "TOP" ? state.top : state.bottom,
  );
  const clearProduct = useFittingSelectionStore((state) => state.clearProduct);
  const isSelected = selectedProduct === null;
  const label = itemType === "TOP" ? "상의" : "하의";
  const ProductIcon = itemType === "TOP" ? TopIcon : BottomIcon;

  return (
    <button
      aria-pressed={isSelected}
      className={`${styles.productCard} ${isSelected ? styles.selected : ""}`}
      onClick={() => clearProduct(itemType)}
      type="button"
    >
      <span className={`${styles.imageArea} ${styles.emptyImageArea}`}>
        <ProductIcon />
      </span>
      <span className={styles.productDetails}>
        <small>{label}</small>
        <strong>선택 안 함</strong>
        <span>피팅 상품을 선택하지 않아요</span>
      </span>
      <span aria-hidden="true" className={styles.selectionMark}>
        {isSelected && <CheckIcon />}
      </span>
    </button>
  );
}
