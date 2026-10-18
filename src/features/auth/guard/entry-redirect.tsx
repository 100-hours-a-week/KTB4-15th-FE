"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { memberMeQueryOptions } from "@/features/member";
import { RefreshUnauthorizedError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";
import styles from "./access-guard.module.scss";

export function EntryRedirect() {
  const router = useRouter();
  const memberQuery = useQuery({
    ...memberMeQueryOptions,
    retry: false,
  });
  const isUnauthenticated =
    memberQuery.error instanceof RefreshUnauthorizedError;
  let redirectPath: string | null = null;

  if (memberQuery.isSuccess) {
    redirectPath = memberQuery.data.profileCompleted
      ? "/chat"
      : "/profile/setup";
  } else if (isUnauthenticated) {
    redirectPath = "/login";
  }

  useEffect(() => {
    if (redirectPath) router.replace(redirectPath);
  }, [redirectPath, router]);

  if (memberQuery.isPending || redirectPath) {
    return (
      <main
        aria-busy="true"
        aria-live="polite"
        className={`${styles.status} ${styles.loadingStatus}`}
        role="status"
      >
        <span aria-hidden="true" className={styles.spinner} />
        <h1>로그인 상태를 확인하고 있어요</h1>
        <p>잠시만 기다려 주세요.</p>
      </main>
    );
  }

  return (
    <main className={styles.status}>
      <p role="alert">로그인 정보를 확인하지 못했어요.</p>
      <Button
        isLoading={memberQuery.isFetching}
        onClick={() => void memberQuery.refetch()}
        size="small"
        variant="secondary"
      >
        다시 시도
      </Button>
    </main>
  );
}
