"use client";

import { useEffect, useEffectEvent, useRef } from "react";

export function useScrollPagination({
  enabled,
  isFetching,
  fetchNextPage,
}: {
  enabled: boolean;
  isFetching: boolean;
  fetchNextPage: () => Promise<unknown>;
}) {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const loadNextPage = useEffectEvent(() => {
    if (!enabled || isFetching) return false;
    void fetchNextPage();
    return true;
  });

  useEffect(() => {
    let previousY = window.scrollY;
    let canLoad = true;
    // 한 번의 관성 스크롤로 여러 페이지를 요청하지 않는다.
    let idleTimer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        canLoad = true;
      }, 200);
      const y = window.scrollY;
      const movingDown = y > previousY;
      previousY = y;
      const target = loadMoreRef.current;
      if (!canLoad || !movingDown || !target) return;
      const bounds = target.getBoundingClientRect();
      if (bounds.top <= window.innerHeight + 200 && bounds.bottom >= 0) {
        if (loadNextPage()) canLoad = false;
      }
    };
    const onTouchStart = () => {
      canLoad = true;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchstart", onTouchStart);
      clearTimeout(idleTimer);
    };
  }, []);

  return loadMoreRef;
}
