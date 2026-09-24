"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createChatRoom,
  sendChatMessage,
  getChatGenerationStatus,
} from "./api/chat";
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
  const [pendingMessageId, setPendingMessageId] = useState<number | null>(null);

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
      setPendingMessageId(data.messageId);
    },
  });

  const chatGenerationQuery = useQuery({
    queryKey: ["chatGenerationStatus", chatRoomId, pendingMessageId],
    queryFn: () => {
      if (chatRoomId == null || pendingMessageId == null) {
        throw new Error("폴링에 필요한 ID가 없습니다.");
      }

      return getChatGenerationStatus(chatRoomId, pendingMessageId);
    },
    enabled: chatRoomId != null && pendingMessageId != null,
    refetchInterval: (query) => {
      const generationStatus = query.state.data?.generationStatus;
      return generationStatus === "GENERATING" ? 2000 : false;
    },
  });

  useEffect(() => {
    const data = chatGenerationQuery.data;

    if (data == null) {
      return;
    }

    if (data.generationStatus === "COMPLETED") {
      setMessages((currentMessages) => [...currentMessages, data.message]);
      setPendingMessageId(null);
      return;
    }

    if (data.generationStatus === "FAILED") {
      setPendingMessageId(null);
    }
  }, [chatGenerationQuery.data]);

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
        <ChatMessageList
          isGenerating={pendingMessageId != null}
          messages={messages}
        />
      )}
      <div className={styles.composerDock}>
        <ChatComposer isSubmitting={isSubmitting} onSubmit={handleSubmit} />
      </div>
    </>
  );
}
