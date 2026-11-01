"use client";

import Image from "next/image";
import { createContext, useContext, useState, type ReactNode } from "react";
import type { ProductItemType } from "@/shared/schema/product";
import { BottomIcon, CheckIcon, TopIcon } from "@/shared/ui/icon";
import type { FittingCandidate } from "../../schema/fitting-candidate";
import { useFittingSelectionStore } from "../../store/fitting-selection-store";
import actionStyles from "./fitting-wardrobe-card-actions.module.scss";
import styles from "./fitting-wardrobe-card.module.scss";

export const WardrobeSelectionContext = createContext<{
  isEditing: boolean;
  selectedForDelete: Set<number>;
  onToggleDelete: (candidateId: number) => void;
} | null>(null);

export function CandidateSelectButton({
  children,
  product,
}: {
  children: ReactNode;
  product: FittingCandidate;
}) {
  const selection = useContext(WardrobeSelectionContext);
  if (!selection) throw new Error("WardrobeSelectionContext is required");
  const { isEditing, selectedForDelete, onToggleDelete } = selection;
  const selectedProductId = useFittingSelectionStore((state) =>
    product.itemType === "TOP" ? state.top?.productId : state.bottom?.productId,
  );
  const selectProduct = useFittingSelectionStore(
    (state) => state.selectProduct,
  );
  const isSelected = isEditing
    ? selectedForDelete.has(product.fittingCandidateId)
    : selectedProductId === product.productId;

  return (
    <button
      aria-pressed={isSelected}
      className={`${styles.productCard} ${actionStyles.button} ${isSelected ? (isEditing ? actionStyles.selectedForDelete : actionStyles.selected) : ""}`}
      onClick={() =>
        isEditing
          ? onToggleDelete(product.fittingCandidateId)
          : selectProduct(product)
      }
      type="button"
    >
      {children}
      <span aria-hidden="true" className={actionStyles.selectionMark}>
        {isSelected && <CheckIcon />}
      </span>
    </button>
  );
}

export function CandidateImage({
  src,
  priority,
  fallback,
}: {
  src: string;
  priority: boolean;
  fallback: ReactNode;
}) {
  const [imageFailed, setImageFailed] = useState(!src);
  return (
    <span
      aria-label={imageFailed ? "상품 이미지 없음" : undefined}
      className={`${styles.imageArea} ${imageFailed ? styles.emptyImageArea : ""}`}
    >
      {imageFailed ? (
        fallback
      ) : (
        <Image
          alt=""
          className={styles.productImage}
          fill
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          onError={() => setImageFailed(true)}
          sizes="72px"
          src={src}
        />
      )}
    </span>
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
      className={`${styles.productCard} ${actionStyles.button} ${isSelected ? actionStyles.selected : ""}`}
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
      <span aria-hidden="true" className={actionStyles.selectionMark}>
        {isSelected && <CheckIcon />}
      </span>
    </button>
  );
}
