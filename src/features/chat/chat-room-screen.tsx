"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  useChatMessageStream,
  useSendChatMessageMutation,
} from "./model/chat-message-query";
import { useChatRoomHistory } from "./model/use-chat-room-history";
import styles from "./chat-room-screen.module.scss";
import { ChatComposer } from "./ui/composer/chat-composer";
import { ChatMessageList } from "./ui/message/chat-message-list";
import { ApiError, getApiErrorMessage } from "@/shared/api/error";
import { Button } from "@/shared/ui/button";
import { useNavigationVisibility } from "@/shared/ui/navigation";
import { showToast } from "@/shared/ui/toast";

function showSendChatMessageError(error: Error) {
  const message =
    error instanceof ApiError && error.code === "CHAT_ROOM_LIMIT_EXCEEDED"
      ? "채팅방은 최대 100개까지 생성할 수 있습니다."
      : getApiErrorMessage(
          error,
          "메시지를 보내지 못했어요. 다시 시도해 주세요.",
        );

  showToast.error(message, { id: "send-chat-message" });
}

export function ChatRoomScreen({
  chatRoomId,
  anchorMessageId,
}: {
  chatRoomId: number;
  anchorMessageId?: number;
}) {
  const router = useRouter();
  const { isNavigationVisible, keyboardInset } = useNavigationVisibility();
  const submissionLockRef = useRef(false);
  const sendChatMessageMutation = useSendChatMessageMutation();
  const history = useChatRoomHistory(chatRoomId, anchorMessageId);
  const { messages, hasNewerMessages } = history;

  const generatingMessageId =
    (hasNewerMessages
      ? null
      : messages.findLast(
          (message) =>
            message.senderType === "USER" &&
            (message.generationStatus === "PENDING" ||
              message.generationStatus === "GENERATING"),
        )?.messageId) ?? null;

  const chatMessageStream = useChatMessageStream(
    chatRoomId,
    generatingMessageId,
  );

  useEffect(() => {
    if (chatMessageStream.error == null) {
      return;
    }

    showToast.error(chatMessageStream.error.message, {
      id: "chat-message-stream",
    });
  }, [chatMessageStream.error]);

  const isGenerating = generatingMessageId != null;

  const handleSubmit = async (content: string) => {
    if (submissionLockRef.current || isGenerating) {
      return;
    }

    submissionLockRef.current = true;

    try {
      await sendChatMessageMutation.mutateAsync(
        { chatRoomId, content },
        { onError: showSendChatMessageError },
      );
      if (hasNewerMessages) router.replace(`/chat/${chatRoomId}`);
    } finally {
      submissionLockRef.current = false;
    }
  };

  const handleRetry = (content: string) => {
    if (submissionLockRef.current || sendChatMessageMutation.isPending) {
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

  const isSubmitting = sendChatMessageMutation.isPending || isGenerating;
  const { initialError } = history;
  const isChatRoomMissingOrForbidden =
    initialError instanceof ApiError &&
    (initialError.code === "CHAT_ROOM_NOT_FOUND" ||
      initialError.code === "CHAT_ROOM_ACCESS_DENIED");

  const isAnchorMissing =
    anchorMessageId != null &&
    initialError instanceof ApiError &&
    initialError.code === "CHAT_MESSAGE_NOT_FOUND";

  if (initialError != null) {
    return (
      <main className={styles.errorState} role="alert">
        <div className={styles.errorContent}>
          <h1>채팅방을 확인하지 못했어요</h1>
          <p>
            {isChatRoomMissingOrForbidden
              ? "존재하지 않거나 접근할 수 없는 채팅방이에요."
              : isAnchorMissing
                ? "검색한 메시지를 찾을 수 없어요."
                : "잠시 후 다시 시도해 주세요."}
          </p>
          <Button
            isLoading={
              !isChatRoomMissingOrForbidden &&
              !isAnchorMissing &&
              history.isFetching
            }
            onClick={() =>
              isChatRoomMissingOrForbidden
                ? router.replace("/chat")
                : isAnchorMissing
                  ? router.replace(`/chat/${chatRoomId}`)
                  : void history.refetch()
            }
          >
            {isChatRoomMissingOrForbidden
              ? "채팅 홈으로 이동"
              : isAnchorMissing
                ? "최신 대화 보기"
                : "다시 시도"}
          </Button>
        </div>
      </main>
    );
  }

  return (
    <>
      <ChatMessageList
        anchorMessageId={history.anchorMessageId}
        hasNewerMessages={hasNewerMessages}
        hasPreviousMessages={history.hasPreviousMessages}
        onLoadNewerMessages={history.loadNewerMessages}
        isGenerating={isGenerating}
        isLoadingPreviousMessages={history.isLoadingPreviousMessages}
        isRetryPending={sendChatMessageMutation.isPending}
        messages={messages}
        onLoadPreviousMessages={history.loadPreviousMessages}
        onRetryMessage={handleRetry}
        streamingContent={chatMessageStream.content}
      />
      <div
        className={`${styles.composerDock} ${
          isNavigationVisible && keyboardInset === 0
            ? ""
            : styles.navigationHidden
        }`}
        style={keyboardInset > 0 ? { bottom: keyboardInset } : undefined}
      >
        <ChatComposer
          disabled={history.isPending}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
        />
      </div>
    </>
  );
}
