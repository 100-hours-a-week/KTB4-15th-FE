"use client";

import Image, { type ImageLoaderProps } from "next/image";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState, type UIEvent } from "react";
import { createFittingCandidate } from "@/features/fitting/api/fitting-candidate";
import type { RecommendedProductResponse } from "../../schema/chat";
import { Button } from "@/shared/ui/button";
//import { Button, IconButton } from "@/shared/ui/button";
//import { HeartIcon } from "@/shared/ui/icon";
import styles from "./recommended-product-list.module.scss";

type RecommendedProductListProps = {
  products: RecommendedProductResponse[];
};

type RecommendedProductCardProps = {
  index: number;
  product: RecommendedProductResponse;
};

function passthroughImageLoader({ src }: ImageLoaderProps) {
  return src;
}

function formatPrice(price: number) {
  return `${new Intl.NumberFormat("ko-KR").format(price)}원`;
}

function RecommendedProductCard({
  index,
  product,
}: RecommendedProductCardProps) {
  const [isFittingCandidate, setIsFittingCandidate] = useState(
    product.isFittingCandidate,
  );
  const fittingCandidateMutation = useMutation({
    mutationFn: () => createFittingCandidate(product.productId),
    onSuccess: () => {
      setIsFittingCandidate(true);
    },
  });

  return (
    <article
      aria-label={`추천 상품 ${index + 1}: ${product.productName}`}
      className={styles.card}
    >
      <div className={styles.imageArea}>
        <Image
          alt={product.productName}
          className={styles.productImage}
          fill
          loader={passthroughImageLoader}
          sizes="(max-width: 480px) 75vw, 320px"
          src={product.productImageUrl}
        />
        <span className={styles.rank}>
          추천 {String(index + 1).padStart(2, "0")}
        </span>
        {/* <IconButton
          aria-label={`${product.productName} 찜 ${isWishlisted ? "해제" : "하기"}`}
          aria-pressed={isWishlisted}
          className={styles.wishlistButton}
          onClick={() => setIsWishlisted((current) => !current)}
          size="small"
          variant="standard"
        >
          <HeartIcon filled={isWishlisted} />
        </IconButton> */}
      </div>

      <div className={styles.details}>
        <div className={styles.summary}>
          <span className={styles.color}>{product.color}</span>
          <strong className={styles.price}>
            {formatPrice(product.currentPrice)}
          </strong>
        </div>
        <h3>{product.productName}</h3>
        <p>{product.recommendedReason}</p>
        <div className={styles.actions}>
          <a
            className={styles.productLink}
            href={product.purchaseUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            상품 보기 <span aria-hidden="true">↗</span>
          </a>
          {isFittingCandidate ? (
            <Link className={styles.fittingLink} href="/fitting">
              피팅룸에서 입어보기 <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <Button
              className={styles.fittingButton}
              fullWidth
              isLoading={fittingCandidateMutation.isPending}
              onClick={() => fittingCandidateMutation.mutate()}
              size="small"
              variant="primary"
            >
              피팅 목록에 추가
            </Button>
          )}
        </div>
      </div>
    </article>
  );
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
    const firstCard = list.firstElementChild as HTMLElement | null;

    if (!firstCard) {
      return;
    }

    const gap = Number.parseFloat(getComputedStyle(list).columnGap) || 0;
    const nextIndex = Math.round(
      list.scrollLeft / (firstCard.offsetWidth + gap),
    );
    setActiveIndex(Math.min(Math.max(nextIndex, 0), products.length - 1));
  };

  const scrollToProduct = (index: number) => {
    const list = listRef.current;
    const card = list?.children.item(index) as HTMLElement | null;

    if (!list || !card) {
      return;
    }

    list.scrollTo({ left: card.offsetLeft, behavior: "smooth" });
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
