"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/shared/ui/button";
import { LoadingMessage } from "@/shared/ui/loading-message";
import { productRankingQueryOptions } from "../model/ranking-query";
import type { RankingType } from "../schema/ranking";
import { RankingRow } from "./ranking-row";
import styles from "./ranking-screen.module.scss";

const RANKING_TABS: { label: string; type: RankingType }[] = [
  { label: "찜순", type: "WISH" },
  { label: "조회순", type: "CLICK" },
];

export function RankingScreen() {
  const [rankingType, setRankingType] = useState<RankingType>("WISH");
  const { data, isError, isFetching, isPending, refetch } = useQuery(
    productRankingQueryOptions(rankingType),
  );
  const products = data?.items;

  return (
    <>
      <div
        aria-label="랭킹 기준"
        className={styles.tabs}
        data-selected={rankingType}
        role="group"
      >
        {RANKING_TABS.map((tab) => {
          const selected = tab.type === rankingType;

          return (
            <button
              aria-pressed={selected}
              className={styles.tab}
              key={tab.type}
              onClick={() => setRankingType(tab.type)}
              type="button"
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className={styles.screen}>
        {isPending && (
          <LoadingMessage className={styles.state}>
            랭킹 정보를 불러오고 있어요
          </LoadingMessage>
        )}
        {isError && (
          <div className={styles.state} role="alert">
            <p>랭킹 정보를 불러올 수 없어요.</p>
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
        {!isPending && !isError && products?.length === 0 && (
          <p className={styles.state}>아직 랭킹에 등록된 상품이 없어요.</p>
        )}
        {products && products.length > 0 && (
          <div className={styles.list}>
            {products.map((product) => (
              <RankingRow
                key={product.productId}
                product={product}
                rank={product.rank}
                rankingType={rankingType}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
