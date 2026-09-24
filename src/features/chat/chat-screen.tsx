"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useMutation,
  useQuery,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createChatRoom,
  sendChatMessage,
  getChatGenerationStatus,
  getChatRoom,
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

export function ChatScreen({ chatRoomId, date }: ChatScreenProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
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
      queryClient.invalidateQueries({
        queryKey: ["chatRoom", chatRoomId],
      });
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

  const chatRoomQuery = useInfiniteQuery({
    queryKey: ["chatRoom", chatRoomId],
    queryFn: ({ pageParam }) => {
      if (chatRoomId == null) {
        throw new Error("채팅방 ID가 없습니다.");
      }

      return getChatRoom(chatRoomId, pageParam);
    },
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.nextCursor : undefined,
    enabled: chatRoomId != null,
  });

  const messages =
    chatRoomQuery.data?.pages.toReversed().flatMap((page) => page.messages) ??
    [];

  const handleLoadPreviousMessages = async () => {
    await chatRoomQuery.fetchNextPage();
  };

  useEffect(() => {
    const data = chatGenerationQuery.data;

    if (data == null) {
      return;
    }

    if (data.generationStatus === "COMPLETED") {
      queryClient.invalidateQueries({
        queryKey: ["chatRoom", chatRoomId],
      });
      setPendingMessageId(null);
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
          key={chatRoomId}
          hasPreviousMessages={chatRoomQuery.hasNextPage}
          isGenerating={pendingMessageId != null}
          isLoadingPreviousMessages={chatRoomQuery.isFetchingNextPage}
          messages={messages}
          onLoadPreviousMessages={handleLoadPreviousMessages}
        />
      )}
      <div className={styles.composerDock}>
        <ChatComposer isSubmitting={isSubmitting} onSubmit={handleSubmit} />
      </div>
    </>
  );
}
