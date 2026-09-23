"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { createChatRoom } from "./api/chat";
import type { ChatMessageResponse, ChatSourceType } from "./schema/chat";
import styles from "./chat-screen.module.scss";
import { ChatComposer } from "./ui/composer/chat-composer";
import { ChatIntro } from "./ui/intro/chat-intro";
import { ChatMessageList } from "./ui/message/chat-message-list";

type ChatScreenProps = {
  date?: string;
  initialMessages?: ChatMessageResponse[];
};

export function ChatScreen({ date, initialMessages = [] }: ChatScreenProps) {
  const router = useRouter();
  const [messages, setMessages] =
    useState<ChatMessageResponse[]>(initialMessages);

  const createChatRoomMutation = useMutation({
    mutationFn: createChatRoom,
    onSuccess: (data) => {
      router.replace(`/chat/${data.chatRoomId}`);
    },
  });

  const handleSubmit = async (
    content: string,
    sourceType: ChatSourceType = "GENERAL",
  ) => {
    await createChatRoomMutation.mutateAsync({
      content,
      sourceType,
    });
  };

  return (
    <>
      {messages.length === 0 && date != null ? (
        <ChatIntro date={date} onSelectQuestion={handleSubmit} />
      ) : (
        <ChatMessageList isGenerating={false} messages={messages} />
      )}
      <div className={styles.composerDock}>
        <ChatComposer
          isSubmitting={createChatRoomMutation.isPending}
          onSubmit={handleSubmit}
        />
      </div>
    </>
  );
}
