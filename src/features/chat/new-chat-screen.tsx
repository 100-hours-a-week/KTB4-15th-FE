"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useCreateChatRoomMutation } from "./model/chat-room-query";
import type { ChatSourceType } from "./schema/chat";
import styles from "./new-chat-screen.module.scss";
import { ChatComposer } from "./ui/composer/chat-composer";
import { ChatIntro } from "./ui/intro/chat-intro";
import { getApiErrorMessage } from "@/shared/api/error";
import { useNavigationVisibility } from "@/shared/ui/navigation";
import { showToast } from "@/shared/ui/toast";

function showSendChatMessageError(error: Error) {
  showToast.error(
    getApiErrorMessage(error, "메시지를 보내지 못했어요. 다시 시도해 주세요."),
    { id: "send-chat-message" },
  );
}

export function NewChatScreen({ date }: { date: string }) {
  const router = useRouter();
  const { isNavigationVisible } = useNavigationVisibility();
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
      <ChatIntro date={date} onSelectQuestion={handleSubmit} />
      <div
        className={`${styles.composerDock} ${
          isNavigationVisible ? "" : styles.navigationHidden
        }`}
      >
        <ChatComposer
          isSubmitting={createChatRoomMutation.isPending}
          onSubmit={handleSubmit}
        />
      </div>
    </>
  );
}
