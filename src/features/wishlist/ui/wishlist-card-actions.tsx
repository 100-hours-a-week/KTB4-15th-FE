"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import type { ReactNode } from "react";
import { useState } from "react";
import { recordPurchaseLinkClick } from "@/features/product";
import { getApiErrorMessage } from "@/shared/api/error";
import { IconButton } from "@/shared/ui/button";
import { HeartIcon } from "@/shared/ui/icon";
import { showToast } from "@/shared/ui/toast";
import {
  useCreateWishlistMutation,
  useDeleteWishlistMutation,
} from "../model/wishlist-query";
import type { WishlistItem } from "../schema/wishlist";
import styles from "./wishlist-card.module.scss";

const ImageViewerDialog = dynamic(() =>
  import("@/shared/ui/dialog").then((module) => module.ImageViewerDialog),
);

export function WishlistImage({
  fallback,
  preload,
  product,
}: {
  fallback: ReactNode;
  preload: boolean;
  product: WishlistItem;
}) {
  const [imageFailed, setImageFailed] = useState(!product.productImageUrl);
  const [isImageOpen, setIsImageOpen] = useState(false);

  if (imageFailed) {
    return (
      <span className={styles.imageArea}>
        <span aria-label="상품 이미지 없음" className={styles.imageFallback}>
          {fallback}
        </span>
      </span>
    );
  }

  return (
    <>
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
          onError={() => setImageFailed(true)}
          preload={preload}
          sizes="72px"
          src={product.productImageUrl}
        />
      </button>
      {isImageOpen && (
        <ImageViewerDialog
          alt={product.productName}
          onError={() => setImageFailed(true)}
          onOpenChange={setIsImageOpen}
          open
          src={product.productImageUrl}
        />
      )}
    </>
  );
}

export function WishlistProductLink({
  children,
  className,
  productId,
  productName,
  purchaseUrl,
}: {
  children: ReactNode;
  className: string;
  productId: number;
  productName: string;
  purchaseUrl: string;
}) {
  return (
    <a
      aria-label={`${productName} 구매 페이지로 이동`}
      className={className}
      href={purchaseUrl}
      onClick={() => {
        void recordPurchaseLinkClick(productId).catch(() => undefined);
      }}
      rel="noopener noreferrer"
      target="_blank"
    >
      {children}
    </a>
  );
}

export function WishlistToggle({
  className,
  product,
}: {
  className: string;
  product: WishlistItem;
}) {
  const [wishlistId, setWishlistId] = useState<number | null>(
    product.wishlistId,
  );
  const createMutation = useCreateWishlistMutation(false);
  const deleteMutation = useDeleteWishlistMutation(false);
  const isWishlisted = wishlistId !== null;
  const isPending = createMutation.isPending || deleteMutation.isPending;

  const handleToggleWishlist = () => {
    if (wishlistId !== null) {
      deleteMutation.mutate(wishlistId, {
        onSuccess: () => setWishlistId(null),
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
    <IconButton
      aria-label={`${product.productName} 찜 ${isWishlisted ? "해제" : "하기"}`}
      aria-pressed={isWishlisted}
      className={className}
      disabled={isPending}
      onClick={handleToggleWishlist}
      size="small"
      variant="standard"
    >
      <HeartIcon filled={isWishlisted} />
    </IconButton>
  );
}
