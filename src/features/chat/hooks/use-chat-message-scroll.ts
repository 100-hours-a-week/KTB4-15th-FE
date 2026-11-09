"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { ChatMessageResponse } from "../schema/chat";

type ChatMessageScrollOptions = {
  anchorMessageId?: number | null;
  hasNewerMessages: boolean;
  hasPreviousMessages: boolean;
  messages: ChatMessageResponse[];
  scrollToMessage: (id: number, align: "start" | "center") => void;
  onLoadNewerMessages?: () => Promise<void>;
  onLoadPreviousMessages?: () => Promise<boolean>;
};

export function useChatMessageScroll({
  anchorMessageId,
  hasNewerMessages,
  hasPreviousMessages,
  messages,
  scrollToMessage,
  onLoadNewerMessages,
  onLoadPreviousMessages,
}: ChatMessageScrollOptions) {
  const listRef = useRef<HTMLDivElement>(null);
  const [isInitialPositioned, setIsInitialPositioned] = useState(false);
  const [unreadReplyId, setUnreadReplyId] = useState<number | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const loadNewerRef = useRef<HTMLDivElement>(null);
  const loadingNewerRef = useRef(false);
  const hadNewerMessagesRef = useRef(hasNewerMessages);
  const isLoadingPreviousMessagesRef = useRef(false);
  const didInitialScrollRef = useRef(false);
  const latestMessageId = messages.at(-1)?.messageId;
  const previousLatestMessageIdRef = useRef<number | undefined>(undefined);

  const scrollToReply = useCallback(
    (messageId: number) => {
      scrollToMessage(messageId, "start");
      setUnreadReplyId(null);
    },
    [scrollToMessage],
  );

  useLayoutEffect(() => {
    return () => {
      if (anchorMessageId == null) return;
      previousLatestMessageIdRef.current = undefined;
      didInitialScrollRef.current = false;
    };
  }, [anchorMessageId]);

  useLayoutEffect(() => {
    if (latestMessageId == null) return;
    const previousId = previousLatestMessageIdRef.current;
    const hadNewerMessages = hadNewerMessagesRef.current;
    hadNewerMessagesRef.current = hasNewerMessages;

    if (previousId == null && anchorMessageId != null) {
      scrollToMessage(anchorMessageId, "center");
      previousLatestMessageIdRef.current = latestMessageId;
      didInitialScrollRef.current = true;
      const frameId = requestAnimationFrame(() => setIsInitialPositioned(true));
      return () => cancelAnimationFrame(frameId);
    }

    if (previousId != null && hadNewerMessages) {
      previousLatestMessageIdRef.current = latestMessageId;
      return;
    }
    if (previousId === latestMessageId) return;

    const latestMessage = messages.at(-1)!;
    const initial = previousId == null;
    let revealFrameId: number | undefined;
    const frameId = requestAnimationFrame(() => {
      if (initial) {
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: "instant",
        });
        // 가상 행의 실제 높이가 반영된 다음 프레임에서 초기 위치를 확정한다.
        revealFrameId = requestAnimationFrame(() => {
          window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: "instant",
          });
          previousLatestMessageIdRef.current = latestMessageId;
          didInitialScrollRef.current = true;
          setIsInitialPositioned(true);
        });
        return;
      }
      previousLatestMessageIdRef.current = latestMessageId;
      if (latestMessage.senderType === "AI") setUnreadReplyId(latestMessageId);
    });
    return () => {
      cancelAnimationFrame(frameId);
      if (revealFrameId != null) cancelAnimationFrame(revealFrameId);
    };
  }, [
    anchorMessageId,
    hasNewerMessages,
    latestMessageId,
    messages,
    scrollToMessage,
  ]);

  useEffect(() => {
    const loadMoreElement = loadMoreRef.current;

    if (
      !isInitialPositioned ||
      loadMoreElement == null ||
      !hasPreviousMessages ||
      onLoadPreviousMessages == null
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          !entry.isIntersecting ||
          !didInitialScrollRef.current ||
          isLoadingPreviousMessagesRef.current
        ) {
          return;
        }

        isLoadingPreviousMessagesRef.current = true;
        void onLoadPreviousMessages().finally(() => {
          isLoadingPreviousMessagesRef.current = false;
        });
      },
      {
        rootMargin: "200px 0px 0px",
      },
    );

    observer.observe(loadMoreElement);

    return () => {
      observer.disconnect();
    };
  }, [hasPreviousMessages, isInitialPositioned, onLoadPreviousMessages]);

  useEffect(() => {
    const trigger = loadNewerRef.current;
    if (
      !isInitialPositioned ||
      !hasNewerMessages ||
      !trigger ||
      !onLoadNewerMessages
    )
      return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          !entry.isIntersecting ||
          !didInitialScrollRef.current ||
          loadingNewerRef.current
        )
          return;
        loadingNewerRef.current = true;
        void onLoadNewerMessages().finally(() => {
          loadingNewerRef.current = false;
        });
      },
      { rootMargin: "0px 0px 200px" },
    );
    observer.observe(trigger);
    return () => observer.disconnect();
  }, [
    hasNewerMessages,
    isInitialPositioned,
    latestMessageId,
    onLoadNewerMessages,
  ]);

  return {
    listRef,
    isInitialPositioned,
    loadMoreRef,
    loadNewerRef,
    latestMessageId,
    unreadReplyId,
    scrollToReply,
  };
}
