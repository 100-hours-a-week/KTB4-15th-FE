"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useContext, useState } from "react";
import { getCurrentFittingJob } from "@/features/fitting/api/fitting-job";
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
import { ChatProductState } from "./chat-product-state";
import styles from "./recommended-product-card.module.scss";

type RecommendedProductCardProps = {
  index: number;
  product: RecommendedProductResponse;
};

export function RecommendedProductCard({
  index,
  product,
}: RecommendedProductCardProps) {
  const router = useRouter();
  const selectProduct = useFittingSelectionStore(
    (state) => state.selectProduct,
  );
  const shared = useContext(ChatProductState);
  const [localState, setLocalState] = useState<
    NonNullable<React.ContextType<typeof ChatProductState>>["products"][number]
  >({});
  const state = shared?.products[product.productId] ?? localState;
  const { isFittingCandidate, fittingCandidateId, isWishlisted, wishlistId } = {
    ...product,
    ...state,
  };
  const updateState = (patch: typeof state) => {
    if (shared) {
      shared.setProducts((products) => ({
        ...products,
        [product.productId]: { ...products[product.productId], ...patch },
      }));
    } else {
      setLocalState((current) => ({ ...current, ...patch }));
    }
  };
  const [isEnteringFitting, setIsEnteringFitting] = useState(false);
  const fittingCandidateMutation = useCreateFittingCandidateMutation();
  const createWishlistMutation = useCreateWishlistMutation();
  const deleteWishlistMutation = useDeleteWishlistMutation();
  const isWishlistPending = state.wishlistPending;

  const handleToggleWishlist = async () => {
    updateState({ wishlistPending: true });
    if (isWishlisted) {
      try {
        if (!wishlistId) throw new Error("Wishlist not found");
        await deleteWishlistMutation.mutateAsync(wishlistId);
        updateState({ wishlistId: null, isWishlisted: false });
      } catch (error) {
        showToast.error(getApiErrorMessage(error, "찜을 해제하지 못했어요."), {
          id: `delete-wishlist:${product.productId}`,
        });
      } finally {
        updateState({ wishlistPending: false });
      }
      return;
    }

    try {
      const created = await createWishlistMutation.mutateAsync(
        product.productId,
      );
      updateState({ wishlistId: created.wishlistId, isWishlisted: true });
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
    } finally {
      updateState({ wishlistPending: false });
    }
  };

  const handleAddFittingCandidate = async () => {
    updateState({ fittingPending: true });
    try {
      const { fittingCandidateId } = await fittingCandidateMutation.mutateAsync(
        product.productId,
      );
      updateState({ fittingCandidateId, isFittingCandidate: true });
      showToast.success("피팅 목록에 추가했어요.", {
        id: `add-fitting-candidate:${product.productId}`,
      });
    } catch (error) {
      showToast.error(
        error instanceof ApiError &&
          error.code === "FITTING_CANDIDATE_LIMIT_EXCEEDED"
          ? "피팅 후보 상품은 최대 300개까지 가능해요."
          : getApiErrorMessage(error, "피팅 목록에 추가하지 못했어요."),
        { id: `add-fitting-candidate:${product.productId}` },
      );
    } finally {
      updateState({ fittingPending: false });
    }
  };

  const handleEnterFitting = async () => {
    if (!fittingCandidateId) return;

    setIsEnteringFitting(true);
    try {
      const currentJob = await getCurrentFittingJob();
      if (currentJob?.status === "GENERATING") {
        showToast.error(
          "다른 피팅 작업 중 이에요.\n잠시 후 다시 시도해주세요.",
        );
        return;
      }

      selectProduct({
        fittingCandidateId,
        productId: product.productId,
        productName: product.productName,
        productImageUrl: product.productImageUrl,
        currentPrice: product.currentPrice,
        color: product.color,
        itemType: product.itemType,
      });
      router.push("/fitting");
    } catch (error) {
      showToast.error(
        getApiErrorMessage(
          error,
          "피팅 작업을 확인하지 못했어요.\n잠시 후 다시 시도해 주세요.",
        ),
      );
    } finally {
      setIsEnteringFitting(false);
    }
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
            <Button
              aria-label="피팅룸에서 입어보기"
              className={styles.fittingLink}
              fullWidth
              isLoading={isEnteringFitting}
              onClick={() => void handleEnterFitting()}
              size="small"
              variant="primary"
            >
              <span aria-hidden="true" className={styles.fittingLabelFull}>
                피팅룸에서 입어보기
              </span>
              <span aria-hidden="true" className={styles.fittingLabelShort}>
                입어보기
              </span>{" "}
              <span aria-hidden="true">→</span>
            </Button>
          ) : (
            <Button
              className={styles.fittingButton}
              fullWidth
              isLoading={state.fittingPending}
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
