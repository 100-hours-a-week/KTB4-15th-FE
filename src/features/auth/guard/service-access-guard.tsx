"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { memberMeQueryOptions } from "@/features/member";
import type { MemberMe } from "@/features/member/schema/member";
import { RefreshUnauthorizedError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";
import { useSessionExpiration } from "../session/use-session-expiration";
import styles from "./access-guard.module.scss";

const PROFILE_SETUP_PATH = "/profile/setup";

export function ServiceAccessGuard({
  children,
  initialMember,
}: {
  children: ReactNode;
  initialMember: MemberMe;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { expireSession, isSessionExpired } = useSessionExpiration();
  const memberQuery = useQuery({
    ...memberMeQueryOptions,
    initialData: initialMember,
    retry: false,
  });
  const isProfileSetupPage = pathname === PROFILE_SETUP_PATH;
  const isUnauthenticated =
    isSessionExpired || memberQuery.error instanceof RefreshUnauthorizedError;
  const isProfileCompleted = memberQuery.data?.profileCompleted === true;
  const isProfileIncomplete =
    memberQuery.isSuccess && !memberQuery.data.profileCompleted;
  const shouldRedirectToChat = isProfileCompleted && isProfileSetupPage;
  const shouldRedirectToProfileSetup =
    isProfileIncomplete && !isProfileSetupPage;

  useEffect(() => {
    if (isUnauthenticated) {
      expireSession();
      return;
    }

    if (shouldRedirectToChat) {
      router.replace("/chat");
      return;
    }

    if (shouldRedirectToProfileSetup) {
      router.replace(PROFILE_SETUP_PATH);
    }
  }, [
    expireSession,
    isUnauthenticated,
    router,
    shouldRedirectToChat,
    shouldRedirectToProfileSetup,
  ]);

  const canRenderPage =
    (isProfileCompleted && !isProfileSetupPage) ||
    (isProfileIncomplete && isProfileSetupPage);

  if (canRenderPage) return children;

  if (memberQuery.isPending) {
    return (
      <main
        aria-busy="true"
        aria-live="polite"
        className={`${styles.status} ${styles.loadingStatus}`}
        role="status"
      >
        <span aria-hidden="true" className={styles.spinner} />
        <h1>사용자 정보를 확인하고 있어요</h1>
        <p>잠시만 기다려 주세요.</p>
      </main>
    );
  }

  if (
    isUnauthenticated ||
    shouldRedirectToChat ||
    shouldRedirectToProfileSetup
  ) {
    return null;
  }

  return (
    <main className={styles.status}>
      <p role="alert">사용자 정보를 확인하지 못했어요.</p>
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
