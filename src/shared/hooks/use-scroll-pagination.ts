"use client";

import { useEffect, useState, type RefObject } from "react";

export function useScrollPagination({
  enabled,
  isFetching,
  fetchNextPage,
  rootRef,
}: {
  enabled: boolean;
  isFetching: boolean;
  fetchNextPage: () => Promise<unknown>;
  rootRef?: RefObject<HTMLElement | null>;
}) {
  const [target, setTarget] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled || isFetching || !target) return;

    let requested = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || requested) return;
        requested = true;
        void fetchNextPage();
      },
      { root: rootRef?.current ?? null, rootMargin: "0px 0px 200px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [enabled, fetchNextPage, isFetching, rootRef, target]);

  return setTarget;
}
