"use client";

import type { ReactNode } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useScrollPagination } from "@/shared/hooks/use-scroll-pagination";
import { Button } from "@/shared/ui/button";
import { LoadingMessage } from "@/shared/ui/loading-message";
import { wishlistListQueryOptions } from "../model/wishlist-query";
import type { WishlistList } from "../schema/wishlist";
import { WishlistCard } from "./wishlist-card";
import styles from "./wishlist-screen.module.scss";

export function WishlistScreen({
  initialCards,
  initialPage,
}: {
  initialCards?: ReactNode;
  initialPage?: WishlistList;
}) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetching,
    isFetchingNextPage,
    isPending,
    refetch,
  } = useInfiniteQuery({
    ...wishlistListQueryOptions,
    initialData: initialPage
      ? {
          pageParams: [undefined],
          pages: [initialPage],
        }
      : undefined,
    staleTime: initialPage ? 30_000 : undefined,
  });
  const loadMoreRef = useScrollPagination({
    enabled: Boolean(hasNextPage) && !isError,
    isFetching,
    fetchNextPage,
  });
  const showServerCards =
    initialCards != null &&
    initialPage != null &&
    data?.pages[0] === initialPage;
  const products =
    data?.pages.slice(showServerCards ? 1 : 0).flatMap((page) => page.items) ??
    [];
  const totalCount = data?.pages[0]?.totalCount ?? 0;
  const isInitialError = isError && data == null;
  const hasInitialProducts =
    showServerCards && Boolean(initialPage?.items.length);
  const hasProducts = hasInitialProducts || products.length > 0;

  return (
    <>
      {isPending && (
        <LoadingMessage className={styles.state}>
          찜 목록을 불러오고 있어요
        </LoadingMessage>
      )}
      {isInitialError && (
        <div className={styles.state} role="alert">
          <p>찜 목록을 불러오지 못했어요.</p>
          <Button
            isLoading={isFetching}
            onClick={() => void refetch()}
            size="small"
            variant="secondary"
          >
            다시 시도
          </Button>
        </div>
      )}
      {!isPending && !isInitialError && !hasProducts && (
        <div className={styles.empty}>
          <p>찜 목록이 비어있어요.</p>
        </div>
      )}
      {hasProducts && (
        <>
          <p className={styles.count}>전체 {totalCount.toLocaleString()}개</p>
          <div className={styles.list}>
            {showServerCards && initialCards}
            {products.map((product, index) => (
              <WishlistCard
                key={product.wishlistId}
                preload={!showServerCards && index === 0}
                product={product}
              />
            ))}
            <div className={styles.loadMore} ref={loadMoreRef}>
              {isFetchingNextPage && "찜 목록을 더 불러오고 있어요."}
              {hasNextPage && !isError && (
                <Button
                  isLoading={isFetchingNextPage}
                  onClick={() => void fetchNextPage()}
                  size="small"
                  variant="secondary"
                >
                  더 불러오기
                </Button>
              )}
              {isError && data && (
                <Button
                  isLoading={isFetchingNextPage}
                  onClick={() => void fetchNextPage()}
                  size="small"
                  variant="secondary"
                >
                  다시 시도
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
