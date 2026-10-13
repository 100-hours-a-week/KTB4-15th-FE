"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { currentFittingJobQueryOptions } from "../model/fitting-query";

export function FittingEntryRedirect({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: fittingJob, isPending } = useQuery(
    currentFittingJobQueryOptions,
  );

  useEffect(() => {
    if (fittingJob) {
      router.replace(`/fitting/jobs/${fittingJob.fittingJobId}`);
    }
  }, [fittingJob, router]);

  return isPending || fittingJob ? null : children;
}
