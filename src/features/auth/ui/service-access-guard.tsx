"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { memberMeQueryOptions } from "@/features/member";
import {
  RefreshUnauthorizedError,
  subscribeToRefreshUnauthorized,
} from "@/shared/api/client";
import { Button } from "@/shared/ui/button";
import styles from "./service-access-guard.module.scss";

const PROFILE_SETUP_PATH = "/profile/setup";

export function ServiceAccessGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [hasRefreshUnauthorized, setHasRefreshUnauthorized] = useState(false);
  const memberQuery = useQuery({
    ...memberMeQueryOptions,
    retry: false,
  });
  const isProfileSetupPage = pathname === PROFILE_SETUP_PATH;
  const isUnauthenticated =
    hasRefreshUnauthorized ||
    memberQuery.error instanceof RefreshUnauthorizedError;
  const isProfileCompleted = memberQuery.data?.profileCompleted === true;
  const isProfileIncomplete =
    memberQuery.isSuccess && !memberQuery.data.profileCompleted;
  const shouldRedirectToChat = isProfileCompleted && isProfileSetupPage;
  const shouldRedirectToProfileSetup =
    isProfileIncomplete && !isProfileSetupPage;

  useEffect(
    () =>
      subscribeToRefreshUnauthorized(() => {
        setHasRefreshUnauthorized(true);
      }),
    [],
  );

  useEffect(() => {
    if (isUnauthenticated) {
      router.replace("/login?reason=session-expired");
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
    isUnauthenticated,
    router,
    shouldRedirectToChat,
    shouldRedirectToProfileSetup,
  ]);

  const canRenderPage =
    (isProfileCompleted && !isProfileSetupPage) ||
    (isProfileIncomplete && isProfileSetupPage);

  if (canRenderPage) return children;

  if (
    memberQuery.isPending ||
    isUnauthenticated ||
    shouldRedirectToChat ||
    shouldRedirectToProfileSetup
  ) {
    return (
      <main aria-busy="true" className={styles.status}>
        <p>사용자 정보를 확인하고 있어요.</p>
      </main>
    );
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
