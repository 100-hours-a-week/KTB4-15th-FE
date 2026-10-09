"use client";

import Image, { type ImageLoaderProps } from "next/image";
import { useState } from "react";
import { getApiErrorMessage } from "@/shared/api/error";
import { IconButton } from "@/shared/ui/button";
import { ImageViewerDialog } from "@/shared/ui/dialog";
import { BottomIcon, HeartIcon, TopIcon } from "@/shared/ui/icon";
import { showToast } from "@/shared/ui/toast";
import { formatPrice } from "@/shared/utils/price-format";
import { getPriceChangeText } from "../lib/wishlist-display";
import {
  useCreateWishlistMutation,
  useDeleteWishlistMutation,
} from "../model/wishlist-query";
import type { WishlistItem } from "../schema/wishlist";
import styles from "./wishlist-card.module.scss";

function passthroughImageLoader({ src }: ImageLoaderProps) {
  return src;
}

export function WishlistCard({ product }: { product: WishlistItem }) {
  const ProductFallbackIcon = product.itemType === "TOP" ? TopIcon : BottomIcon;
  const [imageFailed, setImageFailed] = useState(!product.productImageUrl);
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [wishlistId, setWishlistId] = useState<number | null>(
    product.wishlistId,
  );
  const createMutation = useCreateWishlistMutation(false);
  const deleteMutation = useDeleteWishlistMutation(false);
  const priceChanged = product.wishedPrice !== product.currentPrice;
  const isWishlisted = wishlistId !== null;
  const isPending = createMutation.isPending || deleteMutation.isPending;

  const handleToggleWishlist = () => {
    if (wishlistId !== null) {
      deleteMutation.mutate(wishlistId, {
        onSuccess: () => {
          setWishlistId(null);
        },
        onError: (error) =>
          showToast.error(
            getApiErrorMessage(error, "찜을 해제하지 못했어요."),
            { id: `delete-wishlist:${product.wishlistId}` },
          ),
      });
      return;
    }

    createMutation.mutate(product.productId, {
      onSuccess: ({ wishlistId: createdWishlistId }) => {
        setWishlistId(createdWishlistId);
      },
      onError: (error) =>
        showToast.error(
          getApiErrorMessage(error, "찜 목록에 추가하지 못했어요."),
          { id: `create-wishlist:${product.productId}` },
        ),
    });
  };

  return (
    <article className={styles.card}>
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
            className={styles.productImage}
            fill
            loader={passthroughImageLoader}
            onError={() => setImageFailed(true)}
            sizes="84px"
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
        <span className={styles.details}>
          <strong>{product.productName}</strong>
          {priceChanged && (
            <del>찜 당시 가격 {formatPrice(product.wishedPrice)}</del>
          )}
          <span className={styles.currentPrice}>
            {formatPrice(product.currentPrice)}
            {priceChanged && (
              <em>{getPriceChangeText(product.priceChangeRate)}</em>
            )}
          </span>
        </span>
      </a>
      <IconButton
        aria-label={`${product.productName} 찜 ${isWishlisted ? "해제" : "하기"}`}
        aria-pressed={isWishlisted}
        className={styles.deleteButton}
        disabled={isPending}
        onClick={handleToggleWishlist}
        size="medium"
        variant="standard"
      >
        <HeartIcon filled={isWishlisted} />
      </IconButton>

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
