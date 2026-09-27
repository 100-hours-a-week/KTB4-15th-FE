"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getActiveFittingJobId } from "../store/active-fitting-job-storage";

export function FittingEntryGuard() {
  const router = useRouter();

  useEffect(() => {
    const fittingJobId = getActiveFittingJobId();

    if (fittingJobId) {
      router.replace(`/fitting/jobs/${fittingJobId}`);
    }
  }, [router]);

  return null;
}
