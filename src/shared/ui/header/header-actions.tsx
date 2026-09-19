"use client";

import { useRouter } from "next/navigation";
import styles from "./header-action.module.scss";
import {
  BackIcon,
  ConversationListIcon,
  NotificationIcon,
} from "./header-icons";
import { HeaderIconButton } from "./header-icon-button";
import { HeaderIconLink } from "./header-icon-link";

export function ConversationListButton() {
  return (
    <HeaderIconButton aria-label="대화 목록 열기">
      <ConversationListIcon />
    </HeaderIconButton>
  );
}

export function NotificationLink() {
  return (
    <HeaderIconLink
      aria-label="알림으로 이동, 새 알림 있음"
      className={styles.notification}
      href="/notifications"
    >
      <NotificationIcon />
    </HeaderIconLink>
  );
}

export function BackButton() {
  const router = useRouter();

  return (
    <HeaderIconButton aria-label="뒤로 가기" onClick={() => router.back()}>
      <BackIcon />
    </HeaderIconButton>
  );
}
