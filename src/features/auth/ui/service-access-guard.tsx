"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MemberProfileNotFoundError,
  memberProfileQueryOptions,
} from "@/features/profile";
import { RefreshUnauthorizedError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";
import styles from "./service-access-guard.module.scss";

const PROFILE_SETUP_PATH = "/profile/setup";

export function ServiceAccessGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const profileQuery = useQuery({
    ...memberProfileQueryOptions,
    retry: false,
  });
  const isProfileSetupPage = pathname === PROFILE_SETUP_PATH;
  const isUnauthenticated =
    profileQuery.error instanceof RefreshUnauthorizedError;
  const isMemberProfileMissing =
  profileQuery.error instanceof MemberProfileNotFoundError;
  const shouldRedirectToChat = profileQuery.isSuccess && isProfileSetupPage;
  const shouldRedirectToProfileSetup =
    isMemberProfileMissing && !isProfileSetupPage;

  useEffect(() => {
    if (isUnauthenticated) {
      router.replace("/login");
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
    (profileQuery.isSuccess && !isProfileSetupPage) ||
    (isMemberProfileMissing && isProfileSetupPage);

  if (canRenderPage) return children;

  if (
    profileQuery.isPending ||
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
        isLoading={profileQuery.isFetching}
        onClick={() => void profileQuery.refetch()}
        size="small"
        variant="secondary"
      >
        다시 시도
      </Button>
    </main>
  );
}
