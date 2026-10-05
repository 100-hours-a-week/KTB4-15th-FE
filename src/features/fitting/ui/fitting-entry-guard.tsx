"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useSyncExternalStore } from "react";
import { getActiveFittingJobId } from "../store/active-fitting-job-storage";

const subscribe = () => () => {};
const getServerSnapshot = () => undefined;

export function FittingEntryGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const fittingJobId = useSyncExternalStore(
    subscribe,
    getActiveFittingJobId,
    getServerSnapshot,
  );

  useEffect(() => {
    if (fittingJobId) {
      router.replace(`/fitting/jobs/${fittingJobId}`);
    }
  }, [fittingJobId, router]);

  return fittingJobId === null ? children : null;
}
