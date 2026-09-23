"use client";

import { useState } from "react";
import {
  ChatRoomListButton,
  Header,
  NotificationLink,
} from "@/shared/ui/header";
import styles from "./chat-header.module.scss";
import { ChatSidebar } from "../sidebar/chat-sidebar";

export function ChatHeader() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Header
        center={<h1 className={styles.title}>AI 패션 스타일리스트</h1>}
        left={<ChatRoomListButton onClick={() => setSidebarOpen(true)} />}
        // right={<NotificationLink />}
      />
      <ChatSidebar onOpenChange={setSidebarOpen} open={sidebarOpen} />
    </>
  );
}
