"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";
import {
  ChatActiveIcon,
  ChatIcon,
  FittingActiveIcon,
  FittingIcon,
  MyPageActiveIcon,
  MyPageIcon,
  RankingActiveIcon,
  RankingIcon,
  WishlistActiveIcon,
  WishlistIcon,
} from "./navigation-icons";
import styles from "./navigation-bar.module.scss";
import { NavigationItem } from "./navigation-item";
import { useNavigationVisibility } from "./navigation-visibility";

const SCROLL_THRESHOLD = 8;

const NAVIGATION_ITEMS = [
  {
    label: "찜",
    href: "/wishlists",
    icon: WishlistIcon,
    activeIcon: WishlistActiveIcon,
  },
  {
    label: "피팅",
    href: "/fitting",
    icon: FittingIcon,
    activeIcon: FittingActiveIcon,
  },
  {
    label: "채팅",
    href: "/chat",
    icon: ChatIcon,
    activeIcon: ChatActiveIcon,
    featured: true,
  },
  {
    label: "랭킹",
    href: "/ranking",
    icon: RankingIcon,
    activeIcon: RankingActiveIcon,
    available: false,
  },
  {
    label: "마이",
    href: "/mypage",
    icon: MyPageIcon,
    activeIcon: MyPageActiveIcon,
  },
] as const;

type NavigationBarProps = {
  className?: string;
};

export function NavigationBar({ className }: NavigationBarProps) {
  const pathname = usePathname();
  const { isNavigationVisible, setIsNavigationVisible } =
    useNavigationVisibility();
  const lastScrollY = useRef(0);
  const classNames = [
    styles.bar,
    !isNavigationVisible && styles.hidden,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  useLayoutEffect(() => {
    setIsNavigationVisible(true);
    lastScrollY.current = window.scrollY;
  }, [pathname, setIsNavigationVisible]);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY.current;

      if (currentScrollY <= 0) {
        setIsNavigationVisible(true);
        lastScrollY.current = 0;
        return;
      }

      if (Math.abs(scrollDelta) < SCROLL_THRESHOLD) {
        return;
      }

      setIsNavigationVisible(scrollDelta < 0);
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, [setIsNavigationVisible]);

  return (
    <nav aria-label="주요 메뉴" className={classNames}>
      <div className={styles.items}>
        {NAVIGATION_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return <NavigationItem key={item.href} {...item} active={active} />;
        })}
      </div>
    </nav>
  );
}
