"use client";

import Image, { type ImageLoaderProps } from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  useCreateWishlistMutation,
  useDeleteWishlistMutation,
} from "@/features/wishlist";
import { recordPurchaseLinkClick } from "@/features/product";
import { ApiError, getApiErrorMessage } from "@/shared/api/error";
import { Button, IconButton } from "@/shared/ui/button";
import { HeartIcon } from "@/shared/ui/icon";
import { showToast } from "@/shared/ui/toast";
import { formatPrice } from "@/shared/utils/price-format";
import { useCreateFittingCandidateMutation } from "@/features/fitting";
import { useFittingSelectionStore } from "@/features/fitting/store/fitting-selection-store";
import type { RecommendedProductResponse } from "../../schema/chat";
import styles from "./recommended-product-card.module.scss";

type RecommendedProductCardProps = {
  index: number;
  product: RecommendedProductResponse;
};

function passthroughImageLoader({ src }: ImageLoaderProps) {
  return src;
}

export function RecommendedProductCard({
  index,
  product,
}: RecommendedProductCardProps) {
  const selectProduct = useFittingSelectionStore(
    (state) => state.selectProduct,
  );
  const [isFittingCandidate, setIsFittingCandidate] = useState(
    product.isFittingCandidate,
  );
  const [fittingCandidateId, setFittingCandidateId] = useState(
    product.fittingCandidateId,
  );
  const [isWishlisted, setIsWishlisted] = useState(product.isWishlisted);
  const [wishlistId, setWishlistId] = useState(product.wishlistId);
  const fittingCandidateMutation = useCreateFittingCandidateMutation();
  const createWishlistMutation = useCreateWishlistMutation();
  const deleteWishlistMutation = useDeleteWishlistMutation();
  const isWishlistPending =
    createWishlistMutation.isPending || deleteWishlistMutation.isPending;

  const handleToggleWishlist = async () => {
    if (isWishlisted) {
      try {
        if (!wishlistId) throw new Error("Wishlist not found");
        await deleteWishlistMutation.mutateAsync(wishlistId);
        setWishlistId(null);
        setIsWishlisted(false);
      } catch (error) {
        showToast.error(getApiErrorMessage(error, "찜을 해제하지 못했어요."), {
          id: `delete-wishlist:${product.productId}`,
        });
      }
      return;
    }

    try {
      const created = await createWishlistMutation.mutateAsync(
        product.productId,
      );
      setWishlistId(created.wishlistId);
      setIsWishlisted(true);
      showToast.success("찜 목록에 추가했어요.", {
        id: `create-wishlist:${product.productId}`,
      });
    } catch (error) {
      const isLimitExceeded =
        error instanceof ApiError && error.code === "WISHLIST_LIMIT_EXCEEDED";
      showToast.error(
        isLimitExceeded
          ? "찜 목록은 최대 300개까지 추가할 수 있어요."
          : getApiErrorMessage(error, "찜 목록에 추가하지 못했어요."),
        {
          id: isLimitExceeded
            ? "wishlist-limit"
            : `create-wishlist:${product.productId}`,
        },
      );
    }
  };

  const handleAddFittingCandidate = () => {
    fittingCandidateMutation.mutate(product.productId, {
      onSuccess: ({ fittingCandidateId }) => {
        setFittingCandidateId(fittingCandidateId);
        setIsFittingCandidate(true);
        showToast.success("피팅 목록에 추가했어요.", {
          id: `add-fitting-candidate:${product.productId}`,
        });
      },
      onError: (error) => {
        showToast.error(
          getApiErrorMessage(error, "피팅 목록에 추가하지 못했어요."),
          {
            id: `add-fitting-candidate:${product.productId}`,
          },
        );
      },
    });
  };

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
        <IconButton
          aria-label={`${product.productName} 찜 ${isWishlisted ? "해제" : "하기"}`}
          aria-pressed={isWishlisted}
          className={styles.wishlistButton}
          disabled={isWishlistPending}
          onClick={() => void handleToggleWishlist()}
          size="small"
          variant="standard"
        >
          <HeartIcon filled={isWishlisted} />
        </IconButton>
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
            onClick={() => {
              void recordPurchaseLinkClick(product.productId).catch(
                () => undefined,
              );
            }}
            rel="noopener noreferrer"
            target="_blank"
          >
            상품 보기 <span aria-hidden="true">↗</span>
          </a>
          {isFittingCandidate ? (
            <Link
              className={styles.fittingLink}
              href="/fitting"
              onClick={() => {
                if (!fittingCandidateId) return;

                selectProduct({
                  fittingCandidateId,
                  productId: product.productId,
                  productName: product.productName,
                  productImageUrl: product.productImageUrl,
                  currentPrice: product.currentPrice,
                  color: product.color,
                  itemType: product.itemType,
                });
              }}
            >
              피팅룸에서 입어보기 <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <Button
              className={styles.fittingButton}
              fullWidth
              isLoading={fittingCandidateMutation.isPending}
              onClick={handleAddFittingCandidate}
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
