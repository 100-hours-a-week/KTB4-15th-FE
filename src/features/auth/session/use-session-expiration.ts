"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { clearFittingSelection } from "@/features/fitting/store/fitting-selection-store";
import { subscribeToRefreshUnauthorized } from "@/shared/api/client";

export function useSessionExpiration() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const hasHandledExpiration = useRef(false);

  const expireSession = useCallback(() => {
    setIsSessionExpired(true);

    if (hasHandledExpiration.current) return;

    hasHandledExpiration.current = true;
    clearFittingSelection();
    queryClient.clear();
    router.replace("/login?reason=session-expired");
  }, [queryClient, router]);

  useEffect(
    () => subscribeToRefreshUnauthorized(expireSession),
    [expireSession],
  );

  return { expireSession, isSessionExpired };
}
