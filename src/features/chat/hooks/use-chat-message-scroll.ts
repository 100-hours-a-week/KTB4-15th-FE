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
  const isNearBottomRef = useRef(true);
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

  useEffect(() => {
    const updatePosition = () => {
      isNearBottomRef.current =
        document.documentElement.scrollHeight -
          window.scrollY -
          window.innerHeight <
        120;
      if (isNearBottomRef.current) setUnreadReplyId(null);
    };
    window.addEventListener("scroll", updatePosition, { passive: true });
    return () => window.removeEventListener("scroll", updatePosition);
  }, []);

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
      isNearBottomRef.current =
        document.documentElement.scrollHeight -
          window.scrollY -
          window.innerHeight <
        120;
      previousLatestMessageIdRef.current = latestMessageId;
      didInitialScrollRef.current = true;
      return;
    }

    if (previousId != null && hadNewerMessages) {
      previousLatestMessageIdRef.current = latestMessageId;
      return;
    }
    if (previousId === latestMessageId) return;

    const latestMessage = messages.at(-1)!;
    const initial = previousId == null;
    const shouldFollow =
      initial || latestMessage.senderType === "USER" || isNearBottomRef.current;
    const frameId = requestAnimationFrame(() => {
      previousLatestMessageIdRef.current = latestMessageId;
      if (initial || latestMessage.senderType === "USER") {
        setUnreadReplyId(null);
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior:
            initial ||
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
              ? "instant"
              : "smooth",
        });
      } else if (shouldFollow) {
        scrollToReply(latestMessageId);
      } else {
        setUnreadReplyId(latestMessageId);
      }
      didInitialScrollRef.current = true;
    });
    return () => cancelAnimationFrame(frameId);
  }, [
    anchorMessageId,
    hasNewerMessages,
    latestMessageId,
    messages,
    scrollToMessage,
    scrollToReply,
  ]);

  useEffect(() => {
    const loadMoreElement = loadMoreRef.current;

    if (
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
  }, [hasPreviousMessages, onLoadPreviousMessages]);

  useEffect(() => {
    const trigger = loadNewerRef.current;
    if (!hasNewerMessages || !trigger || !onLoadNewerMessages) return;

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
  }, [hasNewerMessages, latestMessageId, onLoadNewerMessages]);

  return {
    listRef,
    loadMoreRef,
    loadNewerRef,
    latestMessageId,
    unreadReplyId,
    scrollToReply,
  };
}
