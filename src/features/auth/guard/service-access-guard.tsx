"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { memberMeQueryOptions } from "@/features/member";
import type { MemberMe } from "@/features/member/schema/member";
import { RefreshUnauthorizedError } from "@/shared/api/client";
import { useSessionExpiration } from "../session/use-session-expiration";

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
  return null;
}
