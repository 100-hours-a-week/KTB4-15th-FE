"use client";

import { useState } from "react";
import type { RankingType } from "../schema/ranking";
import styles from "./ranking-screen.module.scss";

const RANKING_TABS: { label: string; type: RankingType }[] = [
  { label: "찜 랭킹", type: "WISH" },
  { label: "조회수", type: "CLICK" },
];

export function RankingScreen() {
  const [rankingType, setRankingType] = useState<RankingType>("WISH");

  return (
    <>
      <div aria-label="랭킹 기준" className={styles.tabs} role="group">
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
      <div className={styles.screen} />
    </>
  );
}
