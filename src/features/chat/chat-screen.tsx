"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  useMutation,
  useQuery,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createChatRoom } from "./api/chat";
import {
  chatMessageGenerationStatusQueryOptions,
  chatQueryKeys,
  chatRoomQueryOptions,
  useSendChatMessageMutation,
} from "./model/chat-query";
import { Button } from "@/shared/ui/button";
import { showToast } from "@/shared/ui/toast";
import { getApiErrorMessage } from "@/shared/api/error";
import type { ChatSourceType } from "./schema/chat";
import styles from "./chat-screen.module.scss";
import { ChatComposer } from "./ui/composer/chat-composer";
import { ChatIntro } from "./ui/intro/chat-intro";
import { ChatMessageList } from "./ui/message/chat-message-list";
import { useNavigationVisibility } from "@/shared/ui/navigation";

type ChatScreenProps = {
  chatRoomId?: number;
  date?: string;
};

function showSendChatMessageError(error: Error) {
  showToast.error(
    getApiErrorMessage(error, "메시지를 보내지 못했어요. 다시 시도해 주세요."),
    { id: "send-chat-message" },
  );
}

export function ChatScreen({ chatRoomId, date }: ChatScreenProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isNavigationVisible } = useNavigationVisibility();
  const submissionLockRef = useRef(false);

  const createChatRoomMutation = useMutation({
    mutationFn: createChatRoom,
    onSuccess: (data) => {
      router.replace(`/chat/${data.chatRoomId}`);
    },
    onError: showSendChatMessageError,
  });

  const sendChatMessageMutation = useSendChatMessageMutation();

  const chatRoomQuery = useInfiniteQuery(chatRoomQueryOptions(chatRoomId));

  const messages =
    chatRoomQuery.data?.pages.toReversed().flatMap((page) => page.messages) ??
    [];

  const generatingMessageId =
    messages.findLast(
      (message) =>
        message.senderType === "USER" &&
        message.generationStatus === "GENERATING",
    )?.messageId ?? null;

  const chatMessageGenerationStatusQuery = useQuery(
    chatMessageGenerationStatusQueryOptions(chatRoomId, generatingMessageId),
  );

  const handleLoadPreviousMessages = async () => {
    await chatRoomQuery.fetchNextPage();
  };

  useEffect(() => {
    const generationStatus =
      chatMessageGenerationStatusQuery.data?.generationStatus;

    if (generationStatus !== "COMPLETED" && generationStatus !== "FAILED") {
      return;
    }

    void queryClient.invalidateQueries({
      queryKey: chatQueryKeys.room(chatRoomId),
    });
  }, [
    chatMessageGenerationStatusQuery.data?.generationStatus,
    chatRoomId,
    queryClient,
  ]);

  const isGenerating =
    generatingMessageId != null &&
    chatMessageGenerationStatusQuery.data?.generationStatus !== "COMPLETED" &&
    chatMessageGenerationStatusQuery.data?.generationStatus !== "FAILED";

  const handleSubmit = async (
    content: string,
    sourceType: ChatSourceType = "GENERAL",
  ) => {
    if (submissionLockRef.current || isGenerating) {
      return;
    }

    submissionLockRef.current = true;

    try {
      if (chatRoomId == null) {
        await createChatRoomMutation.mutateAsync({
          content,
          sourceType,
        });
        return;
      }

      await sendChatMessageMutation.mutateAsync(
        { chatRoomId, content },
        { onError: showSendChatMessageError },
      );
    } finally {
      submissionLockRef.current = false;
    }
  };

  const handleRetry = (content: string) => {
    if (
      chatRoomId == null ||
      submissionLockRef.current ||
      sendChatMessageMutation.isPending
    ) {
      return;
    }

    submissionLockRef.current = true;

    void sendChatMessageMutation
      .mutateAsync(
        { chatRoomId, content },
        { onError: showSendChatMessageError },
      )
      .catch(() => undefined)
      .finally(() => {
        submissionLockRef.current = false;
      });
  };

  const isSubmitting =
    createChatRoomMutation.isPending ||
    sendChatMessageMutation.isPending ||
    isGenerating;
  const isInitialChatRoomPending =
    chatRoomId != null && chatRoomQuery.isPending;
  const isInitialChatRoomError =
    chatRoomId != null && chatRoomQuery.isError && chatRoomQuery.data == null;

  if (isInitialChatRoomError) {
    return (
      <main aria-live="polite" className={styles.errorState}>
        <div className={styles.errorContent}>
          <h1>채팅방을 확인하지 못했어요</h1>
          <p>존재하지 않거나 접근할 수 없는 채팅방이에요.</p>
          <Button onClick={() => router.replace("/chat")}>
            채팅 홈으로 이동
          </Button>
        </div>
      </main>
    );
  }

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
          isRetryPending={sendChatMessageMutation.isPending}
          messages={messages}
          onLoadPreviousMessages={handleLoadPreviousMessages}
          onRetryMessage={handleRetry}
        />
      )}
      <div
        className={`${styles.composerDock} ${
          isNavigationVisible ? "" : styles.navigationHidden
        }`}
      >
        <ChatComposer
          disabled={isInitialChatRoomPending}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
        />
      </div>
    </>
  );
}
