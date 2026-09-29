"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { memberMeQueryOptions } from "@/features/member";
import styles from "./access-guard.module.scss";

export function PublicAccessGuard({ children }: { children: ReactNode }) {
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

  if (memberQuery.isPending || memberQuery.isFetching || destination) {
    return (
      <main aria-busy="true" className={styles.status}>
        <p>로그인 상태를 확인하고 있어요.</p>
      </main>
    );
  }

  return children;
}
