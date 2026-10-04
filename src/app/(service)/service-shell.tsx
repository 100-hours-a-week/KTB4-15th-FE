"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
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
    pathname === "/mypage"
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
  );
}
