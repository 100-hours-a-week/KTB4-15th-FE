"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  ChatRoomListButton,
  NotificationLink,
} from "@/shared/ui/header/header-actions";
import { Header } from "@/shared/ui/header/header";
import { HeaderTitle } from "@/shared/ui/header/header-title";
import styles from "./chat-header.module.scss";

const ChatSidebar = dynamic(() =>
  import("../sidebar/chat-sidebar").then((module) => module.ChatSidebar),
);

export function ChatHeader() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMounted, setSidebarMounted] = useState(false);

  return (
    <>
      <Header
        className={styles.header}
        center={<HeaderTitle>AI 패션 스타일리스트</HeaderTitle>}
        left={
          <ChatRoomListButton
            onClick={() => {
              setSidebarMounted(true);
              setSidebarOpen(true);
            }}
          />
        }
        right={<NotificationLink />}
      />
      {sidebarMounted && (
        <ChatSidebar onOpenChange={setSidebarOpen} open={sidebarOpen} />
      )}
    </>
  );
}
