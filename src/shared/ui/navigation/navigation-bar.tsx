"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "./navigation-bar.module.scss";
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
import { NavigationItem } from "./navigation-item";

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
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const classNames = [styles.bar, !visible && styles.hidden, className]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY.current;

      if (currentScrollY <= 0) {
        setVisible(true);
        lastScrollY.current = 0;
        return;
      }

      if (Math.abs(scrollDelta) < SCROLL_THRESHOLD) {
        return;
      }

      setVisible(scrollDelta < 0);
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav aria-label="주요 메뉴" className={classNames}>
      <div className={styles.items}>
        {NAVIGATION_ITEMS.map((item) => (
          <NavigationItem
            key={item.href}
            {...item}
            active={
              pathname === item.href || pathname.startsWith(`${item.href}/`)
            }
          />
        ))}
      </div>
    </nav>
  );
}
