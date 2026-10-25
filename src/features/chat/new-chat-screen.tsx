"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useCreateChatRoomMutation } from "./model/chat-room-query";
import type { ChatSourceType } from "./schema/chat";
import styles from "./new-chat-screen.module.scss";
import { ChatComposer } from "./ui/composer/chat-composer";
import { ChatIntro } from "./ui/intro/chat-intro";
import { ApiError, getApiErrorMessage } from "@/shared/api/error";
import { useNavigationVisibility } from "@/shared/ui/navigation";
import { showToast } from "@/shared/ui/toast";

function showSendChatMessageError(error: Error) {
  showToast.error(
    error instanceof ApiError && error.code === "CHAT_ROOM_LIMIT_EXCEEDED"
      ? "채팅방은 최대 100개까지 가능해요."
      : getApiErrorMessage(
          error,
          "메시지를 보내지 못했어요. 다시 시도해 주세요.",
        ),
    { id: "send-chat-message" },
  );
}

type NewChatScreenProps = {
  date: string;
  memberName?: string;
  showWishlistQuestion: boolean;
};

export function NewChatScreen({
  date,
  memberName,
  showWishlistQuestion,
}: NewChatScreenProps) {
  const router = useRouter();
  const { isNavigationVisible, keyboardInset } = useNavigationVisibility();
  const submissionLockRef = useRef(false);
  const createChatRoomMutation = useCreateChatRoomMutation();

  const handleSubmit = async (
    content: string,
    sourceType: ChatSourceType = "GENERAL",
  ) => {
    if (submissionLockRef.current) {
      return;
    }

    submissionLockRef.current = true;

    try {
      await createChatRoomMutation.mutateAsync(
        { content, sourceType },
        {
          onSuccess: (data) => {
            router.replace(`/chat/${data.chatRoomId}`);
          },
          onError: showSendChatMessageError,
        },
      );
    } finally {
      submissionLockRef.current = false;
    }
  };

  return (
    <>
      <ChatIntro
        date={date}
        memberName={memberName}
        onSelectQuestion={handleSubmit}
        showWishlistQuestion={showWishlistQuestion}
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
          isSubmitting={createChatRoomMutation.isPending}
          onSubmit={handleSubmit}
        />
      </div>
    </>
  );
}
