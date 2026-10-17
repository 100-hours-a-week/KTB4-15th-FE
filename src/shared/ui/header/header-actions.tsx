"use client";

import { useRouter } from "next/navigation";
import type { MouseEventHandler } from "react";
import { BackIcon } from "@/shared/ui/icon";
import styles from "./header-action.module.scss";
import { ChatRoomListIcon, NotificationIcon } from "./header-icons";
import { HeaderIconButton } from "./header-icon-button";
import { HeaderIconLink } from "./header-icon-link";

type ChatRoomListButtonProps = {
  onClick: MouseEventHandler<HTMLButtonElement>;
};

export function ChatRoomListButton({ onClick }: ChatRoomListButtonProps) {
  return (
    <HeaderIconButton aria-label="대화 목록 열기" onClick={onClick}>
      <ChatRoomListIcon />
    </HeaderIconButton>
  );
}

export function NotificationLink({
  hasUnread = false,
}: {
  hasUnread?: boolean;
}) {
  return (
    <HeaderIconLink
      aria-label={hasUnread ? "알림으로 이동, 새 알림 있음" : "알림으로 이동"}
      className={hasUnread ? styles.notification : undefined}
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
