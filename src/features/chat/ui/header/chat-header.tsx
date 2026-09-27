"use client";

import { useState } from "react";
import { ChatRoomListButton, Header, HeaderTitle } from "@/shared/ui/header";
import { ChatSidebar } from "../sidebar/chat-sidebar";
import styles from "./chat-header.module.scss";

export function ChatHeader() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Header
        className={styles.header}
        center={<HeaderTitle>AI 패션 스타일리스트</HeaderTitle>}
        left={<ChatRoomListButton onClick={() => setSidebarOpen(true)} />}
        // right={<NotificationLink />}
      />
      <ChatSidebar onOpenChange={setSidebarOpen} open={sidebarOpen} />
    </>
  );
}
