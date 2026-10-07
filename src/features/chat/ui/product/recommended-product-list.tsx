"use client";

import { useRef, useState, type UIEvent } from "react";
import type { RecommendedProductResponse } from "../../schema/chat";
import { RecommendedProductCard } from "./recommended-product-card";
import styles from "./recommended-product-list.module.scss";

type RecommendedProductListProps = {
  products: RecommendedProductResponse[];
};

function getProductScrollLeft(list: HTMLDivElement, card: HTMLElement) {
  const cardLeft =
    card.getBoundingClientRect().left -
    list.getBoundingClientRect().left +
    list.scrollLeft;
  const maxScrollLeft = list.scrollWidth - list.clientWidth;

  return Math.min(Math.max(cardLeft, 0), maxScrollLeft);
}

export function RecommendedProductList({
  products,
}: RecommendedProductListProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  if (products.length === 0) {
    return null;
  }

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const list = event.currentTarget;
    const nextIndex = Array.from(list.children).reduce(
      (closestIndex, child, index) => {
        const card = child as HTMLElement;
        const closestCard = list.children.item(closestIndex) as HTMLElement;
        const distance = Math.abs(
          list.scrollLeft - getProductScrollLeft(list, card),
        );
        const closestDistance = Math.abs(
          list.scrollLeft - getProductScrollLeft(list, closestCard),
        );

        return distance < closestDistance ? index : closestIndex;
      },
      0,
    );

    setActiveIndex(nextIndex);
  };

  const scrollToProduct = (index: number) => {
    const list = listRef.current;
    const card = list?.children.item(index) as HTMLElement | null;

    if (!list || !card) {
      return;
    }

    list.scrollTo({
      left: getProductScrollLeft(list, card),
      behavior: "smooth",
    });
  };

  return (
    <section aria-label="AI 추천 상품" className={styles.carousel}>
      <div className={styles.list} onScroll={handleScroll} ref={listRef}>
        {products.map((product, index) => (
          <RecommendedProductCard
            index={index}
            key={product.productId}
            product={product}
          />
        ))}
      </div>

      {products.length > 1 && (
        <div aria-label="추천 상품 페이지" className={styles.pagination}>
          {products.map((product, index) => (
            <button
              aria-label={`추천 상품 ${index + 1} 보기`}
              aria-pressed={activeIndex === index}
              className={styles.pageButton}
              key={product.productId}
              onClick={() => scrollToProduct(index)}
              type="button"
            >
              <span className={styles.pageDot} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
