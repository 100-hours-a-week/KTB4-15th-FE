"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { searchChatRooms } from "../api/chat";

export function useChatSearch() {
  const searchParams = useSearchParams();
  const initialKeyword = (searchParams.get("keyword") ?? "").slice(0, 100);
  const [keyword, setKeyword] = useState(initialKeyword);
  const [debouncedKeyword, setDebouncedKeyword] = useState(
    initialKeyword.trim(),
  );
  const trimmedKeyword = keyword.trim();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedKeyword(trimmedKeyword);
      const url = new URL(window.location.href);
      if (url.searchParams.get("keyword") === (trimmedKeyword || null)) return;
      if (trimmedKeyword) url.searchParams.set("keyword", trimmedKeyword);
      else url.searchParams.delete("keyword");
      window.history.replaceState(null, "", url);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [trimmedKeyword]);

  const showResults = !!trimmedKeyword && trimmedKeyword === debouncedKeyword;
  const query = useInfiniteQuery({
    queryKey: ["chat", "search", debouncedKeyword],
    queryFn: ({ pageParam, signal }) =>
      searchChatRooms(debouncedKeyword, pageParam, signal),
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.nextCursor : undefined,
    enabled: showResults,
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const reachedLastPage =
    showResults &&
    query.isSuccess &&
    query.data.pages.length > 1 &&
    query.data.pages.at(-1)?.hasNext === false;

  return {
    keyword,
    setKeyword,
    debouncedKeyword,
    showResults,
    query,
    reachedLastPage,
  };
}
