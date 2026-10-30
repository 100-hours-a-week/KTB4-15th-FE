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
  const previousY = useRef(0);
  const canLoad = useRef(true);
  const loadNextPage = useEffectEvent(() => {
    if (!enabled || isFetching) return false;
    void fetchNextPage();
    return true;
  });

  useEffect(() => {
    // 한 번의 관성 스크롤로 여러 페이지를 요청하지 않는다.
    let idleTimer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        canLoad.current = true;
      }, 200);
      const y = window.scrollY;
      const movingDown = y > previousY.current;
      previousY.current = y;
      const target = loadMoreRef.current;
      if (!canLoad.current || !movingDown || !target) return;
      const bounds = target.getBoundingClientRect();
      if (bounds.top <= window.innerHeight + 200 && bounds.bottom >= 0) {
        if (loadNextPage()) canLoad.current = false;
      }
    };
    const onTouchStart = () => {
      canLoad.current = true;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    // hydration 전에 끝난 스크롤도 한 번 확인한다.
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchstart", onTouchStart);
      clearTimeout(idleTimer);
    };
  }, []);

  return loadMoreRef;
}
