"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { NotificationProvider } from "@/features/notification";
import {
  NavigationBar,
  NavigationVisibilityProvider,
  TabPageTransition,
} from "@/shared/ui/navigation";
import { PageShell } from "@/shared/ui/page-shell";

function hasNavigation(pathname: string) {
  return (
    pathname === "/chat" ||
    pathname.startsWith("/chat/") ||
    pathname === "/fitting" ||
    pathname === "/wishlists" ||
    pathname === "/ranking" ||
    pathname === "/mypage" ||
    pathname === "/notifications"
  );
}

export function ServiceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showNavigation = hasNavigation(pathname);
  const content = (
    <PageShell surface={pathname === "/profile/setup" ? "surface" : "page"}>
      {children}
    </PageShell>
  );

  return (
    <NotificationProvider>
      <NavigationVisibilityProvider>
        {showNavigation ? (
          <>
            <TabPageTransition>{content}</TabPageTransition>
            <NavigationBar />
          </>
        ) : (
          content
        )}
      </NavigationVisibilityProvider>
    </NotificationProvider>
  );
}
