"use client";

import Image, { type ImageLoaderProps } from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { formatPrice } from "@/shared/utils/price-format";
import { CheckIcon } from "@/shared/ui/icon";
import { useFittingCandidatesQuery } from "../api/fitting-candidate-query";
import { useFittingSelectionStore } from "../model/fitting-selection-store";
import type { FittingCandidate } from "../schema/fitting-candidate";
import styles from "./fitting-wardrobe.module.scss";

type WardrobeFilter = "TOP" | "BOTTOM" | "ALL";

type FittingWardrobeProps = {
  initialFilter: WardrobeFilter;
};

const FILTERS: Array<{ label: string; value: WardrobeFilter }> = [
  { label: "상의", value: "TOP" },
  { label: "하의", value: "BOTTOM" },
  { label: "전체", value: "ALL" },
];

function passthroughImageLoader({ src }: ImageLoaderProps) {
  return src;
}

function CandidateCard({ product }: { product: FittingCandidate }) {
  const selectedProductId = useFittingSelectionStore((state) =>
    product.itemType === "TOP" ? state.top?.productId : state.bottom?.productId,
  );
  const selectProduct = useFittingSelectionStore(
    (state) => state.selectProduct,
  );
  const isSelected = selectedProductId === product.productId;

  return (
    <button
      aria-pressed={isSelected}
      className={`${styles.productCard} ${isSelected ? styles.selected : ""}`}
      onClick={() => selectProduct(product)}
      type="button"
    >
      <span className={styles.imageArea}>
        <Image
          alt=""
          className={styles.productImage}
          fill
          loader={passthroughImageLoader}
          sizes="72px"
          src={product.productImageUrl}
        />
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

export function FittingWardrobe({ initialFilter }: FittingWardrobeProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<WardrobeFilter>(initialFilter);
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isPending,
  } = useFittingCandidatesQuery(filter === "ALL" ? undefined : filter);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const top = useFittingSelectionStore((state) => state.top);
  const bottom = useFittingSelectionStore((state) => state.bottom);
  const selectedCount = Number(Boolean(top)) + Number(Boolean(bottom));
  const products = data?.pages.flatMap((page) => page.items) ?? [];

  useEffect(() => {
    const target = loadMoreRef.current;

    if (!target || !hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "200px 0px" },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div className={styles.screen}>
      <div className={styles.intro}>
        <h2>입어볼 옷을 선택해 주세요</h2>
        <p>대화방과 찜 목록에서 담아둔 상품이에요</p>
      </div>

      <div aria-label="상품 종류" className={styles.filters} role="tablist">
        {FILTERS.map((item) => (
          <button
            aria-selected={filter === item.value}
            className={filter === item.value ? styles.activeFilter : undefined}
            key={item.value}
            onClick={() => setFilter(item.value)}
            role="tab"
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {isPending && (
          <p className={styles.stateMessage}>옷장을 불러오고 있어요.</p>
        )}
        {isError && (
          <p className={styles.stateMessage}>옷장을 불러오지 못했어요.</p>
        )}
        {!isPending && !isError && products.length === 0 && (
          <p className={styles.stateMessage}>담아둔 상품이 아직 없어요.</p>
        )}
        {products.map((product) => (
          <CandidateCard key={product.fittingCandidateId} product={product} />
        ))}
        <div aria-hidden="true" className={styles.loadMore} ref={loadMoreRef}>
          {isFetchingNextPage && "상품을 더 불러오고 있어요."}
        </div>
      </div>

      <div className={styles.bottomAction}>
        <button
          className={styles.completeButton}
          onClick={() => router.push("/fitting")}
          type="button"
        >
          선택 완료 ({selectedCount}/2)
        </button>
      </div>
    </div>
  );
}
