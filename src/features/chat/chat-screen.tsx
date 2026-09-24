"use client";

import { useEffect } from "react";
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
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["chatRoom", chatRoomId],
      });
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

  const generatingMessageId =
    messages.findLast(
      (message) =>
        message.senderType === "USER" &&
        message.generationStatus === "GENERATING",
    )?.messageId ?? null;
  
  const chatGenerationQuery = useQuery({
    queryKey: ["chatGenerationStatus", chatRoomId, generatingMessageId],
    queryFn: () => {
      if (chatRoomId == null || generatingMessageId == null) {
        throw new Error("폴링에 필요한 ID가 없습니다.");
      }

      return getChatGenerationStatus(chatRoomId, generatingMessageId);
    },
    enabled: chatRoomId != null && generatingMessageId != null,
    refetchInterval: (query) => {
      const generationStatus = query.state.data?.generationStatus;
      return generationStatus === "GENERATING" ? 2000 : false;
    },
  });

  const handleLoadPreviousMessages = async () => {
    await chatRoomQuery.fetchNextPage();
  };

  useEffect(() => {
    const generationStatus = chatGenerationQuery.data?.generationStatus;

    if (generationStatus !== "COMPLETED" && generationStatus !== "FAILED") {
      return;
    }

    void queryClient.invalidateQueries({
      queryKey: ["chatRoom", chatRoomId],
    });
  }, [chatGenerationQuery.data?.generationStatus, chatRoomId, queryClient]);

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
  
  const isGenerating =
    generatingMessageId != null &&
    chatGenerationQuery.data?.generationStatus !== "COMPLETED" &&
    chatGenerationQuery.data?.generationStatus !== "FAILED";

  return (
    <>
      {messages.length === 0 && date != null ? (
        <ChatIntro date={date} onSelectQuestion={handleSubmit} />
      ) : (
        <ChatMessageList
          key={chatRoomId}
          hasPreviousMessages={chatRoomQuery.hasNextPage}
          isGenerating={isGenerating}
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
