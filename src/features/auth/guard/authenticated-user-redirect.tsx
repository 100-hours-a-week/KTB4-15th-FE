"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { memberMeQueryOptions } from "@/features/member";

export function AuthenticatedUserRedirect({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const memberQuery = useQuery({
    ...memberMeQueryOptions,
    refetchOnMount: "always",
    retry: false,
  });
  const destination = memberQuery.isSuccess
    ? memberQuery.data.profileCompleted
      ? "/chat"
      : "/profile/setup"
    : null;

  useEffect(() => {
    if (destination && !memberQuery.isFetching) {
      router.replace(destination);
    }
  }, [destination, memberQuery.isFetching, router]);

  return children;
}
