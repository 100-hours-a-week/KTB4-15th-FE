"use client";

import { useEffect } from "react";
import { showToast } from "@/shared/ui/toast";

export function SessionExpiredToast({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;

    showToast.error("로그인이 만료됐어요. 다시 로그인해 주세요.", {
      id: "session-expired",
    });
    const url = new URL(window.location.href);
    url.searchParams.delete("reason");
    window.history.replaceState(null, "", url);
  }, [enabled]);

  return null;
}
