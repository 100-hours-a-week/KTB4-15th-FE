"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { ChatMessageResponse } from "../schema/chat";

const FOLLOW_BOTTOM_THRESHOLD = 64;

function scrollToBottom() {
  window.scrollTo({
    top: document.documentElement.scrollHeight,
    behavior: "instant",
  });
}

type ChatMessageScrollOptions = {
  anchorMessageId?: number | null;
  hasNewerMessages: boolean;
  hasPreviousMessages: boolean;
  messages: ChatMessageResponse[];
  scrollToMessage: (
    id: number,
    align: "start" | "center",
    behavior?: "instant" | "smooth",
  ) => void;
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
  const followBottomRef = useRef(false);
  const didInitialScrollRef = useRef(false);
  const latestMessageId = messages.at(-1)?.messageId;
  const previousLatestMessageIdRef = useRef<number | undefined>(undefined);

  const dismissUnreadReply = useCallback(() => setUnreadReplyId(null), []);

  const scrollToReply = useCallback(
    (messageId: number) => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      );
      scrollToMessage(
        messageId,
        "start",
        reduceMotion.matches ? "instant" : "smooth",
      );
      dismissUnreadReply();
    },
    [dismissUnreadReply, scrollToMessage],
  );

  useLayoutEffect(() => {
    return () => {
      if (anchorMessageId == null) return;
      previousLatestMessageIdRef.current = undefined;
      didInitialScrollRef.current = false;
      followBottomRef.current = false;
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
        scrollToBottom();
        revealFrameId = requestAnimationFrame(() => {
          scrollToBottom();
          followBottomRef.current = true;
          previousLatestMessageIdRef.current = latestMessageId;
          didInitialScrollRef.current = true;
          setIsInitialPositioned(true);
        });
        return;
      }
      previousLatestMessageIdRef.current = latestMessageId;
      if (latestMessage.senderType === "AI")
        setUnreadReplyId(followBottomRef.current ? null : latestMessageId);
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

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || hasNewerMessages) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frameId: number | undefined;
    let animatedScrollY: number | undefined;
    const distanceToBottom = () =>
      document.documentElement.scrollHeight -
      window.scrollY -
      window.innerHeight;

    const updateFollowBottom = () => {
      if (window.scrollY === animatedScrollY) return;
      followBottomRef.current = distanceToBottom() <= FOLLOW_BOTTOM_THRESHOLD;
    };

    // 스트리밍 중에도 한 애니메이션이 매 프레임 최신 하단을 따라간다.
    const followBottom = () => {
      frameId = undefined;
      if (!followBottomRef.current) return;

      const distance = distanceToBottom();
      if (reduceMotion.matches || distance <= 2) {
        scrollToBottom();
      } else {
        window.scrollBy({ top: distance / 4, behavior: "instant" });
        frameId = requestAnimationFrame(followBottom);
      }
      animatedScrollY = window.scrollY;
    };

    const observer = new ResizeObserver(() => {
      if (
        didInitialScrollRef.current &&
        followBottomRef.current &&
        frameId == null &&
        distanceToBottom() > 0
      ) {
        frameId = requestAnimationFrame(followBottom);
      }
    });
    observer.observe(list);
    window.addEventListener("scroll", updateFollowBottom, { passive: true });
    return () => {
      observer.disconnect();
      if (frameId != null) cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", updateFollowBottom);
    };
  }, [hasNewerMessages]);

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
    dismissUnreadReply,
    scrollToReply,
  };
}
