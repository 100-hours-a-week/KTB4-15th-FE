"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";
import styles from "./tab-page-transition.module.scss";

const TAB_PATHS = [
  "/wishlists",
  "/fitting",
  "/chat",
  "/ranking",
  "/mypage",
] as const;

function getTabPath(pathname: string) {
  return TAB_PATHS.find(
    (tabPath) => pathname === tabPath || pathname.startsWith(`${tabPath}/`),
  );
}

type TabPageTransitionProps = {
  children: ReactNode;
};

export function TabPageTransition({ children }: TabPageTransitionProps) {
  const pathname = usePathname();
  const tabPath = getTabPath(pathname);
  const [previousTabPath, setPreviousTabPath] = useState(tabPath);
  const [direction, setDirection] = useState<"forward" | "back">();

  if (tabPath !== previousTabPath) {
    const previousIndex = previousTabPath
      ? TAB_PATHS.indexOf(previousTabPath)
      : -1;
    const currentIndex = tabPath ? TAB_PATHS.indexOf(tabPath) : -1;

    setPreviousTabPath(tabPath);
    setDirection(
      previousIndex >= 0 && currentIndex >= 0
        ? currentIndex > previousIndex
          ? "forward"
          : "back"
        : undefined,
    );
  }

  const directionClass = direction ? styles[direction] : undefined;
  const classNames = [styles.content, directionClass].filter(Boolean).join(" ");

  return (
    <div className={classNames} key={tabPath ?? pathname}>
      {children}
    </div>
  );
}
