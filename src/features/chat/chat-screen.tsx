"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { createChatRoom, sendChatMessage } from "./api/chat";
import type { ChatMessageResponse, ChatSourceType } from "./schema/chat";
import styles from "./chat-screen.module.scss";
import { ChatComposer } from "./ui/composer/chat-composer";
import { ChatIntro } from "./ui/intro/chat-intro";
import { ChatMessageList } from "./ui/message/chat-message-list";

type ChatScreenProps = {
  chatRoomId?: number;
  date?: string;
  initialMessages?: ChatMessageResponse[];
};

export function ChatScreen({
  chatRoomId,
  date,
  initialMessages = [],
}: ChatScreenProps) {
  const router = useRouter();
  const [messages, setMessages] =
    useState<ChatMessageResponse[]>(initialMessages);

  const createChatRoomMutation = useMutation({
    mutationFn: createChatRoom,
    onSuccess: (data) => {
      router.replace(`/chat/${data.chatRoomId}`);
    },
  });

  const sendChatMessageMutation = useMutation({
    mutationFn: ({
      chatRoomId,
      content,
    }: {
      chatRoomId: number;
      content: string;
    }) => sendChatMessage(chatRoomId, { content }),
    onSuccess: (data) => {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          messageId: data.messageId,
          senderType: "USER",
          content: data.content,
          createdAt: new Date().toISOString(),
        },
      ]);
    },
  });

  const handleSubmit = async (
    content: string,
    sourceType: ChatSourceType = "GENERAL",
  ) => {
    if (chatRoomId == null) {
      await createChatRoomMutation.mutateAsync({
        content,
        sourceType,
      });
      return;
    }

    await sendChatMessageMutation.mutateAsync({ chatRoomId, content });
  };

  const isSubmitting =
    createChatRoomMutation.isPending || sendChatMessageMutation.isPending;

  return (
    <>
      {messages.length === 0 && date != null ? (
        <ChatIntro date={date} onSelectQuestion={handleSubmit} />
      ) : (
        <ChatMessageList isGenerating={false} messages={messages} />
      )}
      <div className={styles.composerDock}>
        <ChatComposer isSubmitting={isSubmitting} onSubmit={handleSubmit} />
      </div>
    </>
  );
}
