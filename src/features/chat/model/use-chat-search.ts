"use client";

import { useQuery } from "@tanstack/react-query";
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
      if (trimmedKeyword) url.searchParams.set("keyword", trimmedKeyword);
      else url.searchParams.delete("keyword");
      window.history.replaceState(null, "", url);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [trimmedKeyword]);

  const showResults = !!trimmedKeyword && trimmedKeyword === debouncedKeyword;
  const query = useQuery({
    queryKey: ["chat", "search", debouncedKeyword],
    queryFn: ({ signal }) => searchChatRooms(debouncedKeyword, signal),
    enabled: showResults,
    retry: false,
    refetchOnWindowFocus: false,
  });

  return { keyword, setKeyword, debouncedKeyword, showResults, query };
}
