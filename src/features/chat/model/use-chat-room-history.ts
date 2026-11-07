import { useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { showToast } from "@/shared/ui/toast";
import {
  chatRoomOlderQueryOptions,
  chatRoomQueryOptions,
} from "./chat-room-query";

export function useChatRoomHistory(
  chatRoomId: number,
  anchorMessageId?: number,
) {
  const chatRoomQuery = useInfiniteQuery(
    chatRoomQueryOptions(chatRoomId, anchorMessageId),
  );
  const anchorPage = chatRoomQuery.data?.pages[0];
  const olderCursor =
    anchorMessageId != null && anchorPage?.hasPrevious
      ? anchorPage.previousCursor
      : null;
  const olderQuery = useInfiniteQuery(
    chatRoomOlderQueryOptions(chatRoomId, olderCursor),
  );
  const hasNewerMessages = anchorMessageId != null && chatRoomQuery.hasNextPage;
  const pages =
    anchorMessageId == null
      ? (chatRoomQuery.data?.pages.toReversed() ?? [])
      : [
          ...(olderQuery.data?.pages.toReversed() ?? []),
          ...(chatRoomQuery.data?.pages ?? []),
        ];
  const messages = [
    ...new Map(
      pages.flatMap((page) =>
        page.messages.map((message) => [message.messageId, message] as const),
      ),
    ).values(),
  ];

  const previousQuery = anchorMessageId == null ? chatRoomQuery : olderQuery;
  const { fetchNextPage: fetchPreviousMessages, data: previousData } =
    previousQuery;
  const { fetchNextPage: fetchNewerMessages } = chatRoomQuery;
  const handleLoadNewerMessages = useCallback(async () => {
    const result = await fetchNewerMessages({ cancelRefetch: false });
    if (result.isFetchNextPageError) {
      showToast.error(
        "이후 메시지를 불러오지 못했어요.\n잠시 후 다시 시도해 주세요.",
        {
          id: "newer-chat-messages",
        },
      );
    }
  }, [fetchNewerMessages]);
  const handleLoadPreviousMessages = useCallback(async () => {
    const result = await fetchPreviousMessages({ cancelRefetch: false });
    if (result.isFetchNextPageError) {
      showToast.error(
        "이전 메시지를 불러오지 못했어요.\n잠시 후 다시 시도해 주세요.",
        {
          id: "previous-chat-messages",
        },
      );
      return false;
    }
    return result.data !== previousData;
  }, [fetchPreviousMessages, previousData]);

  return {
    messages,
    anchorMessageId: anchorPage?.anchorMessageId,
    hasNewerMessages,
    hasPreviousMessages:
      anchorMessageId == null
        ? previousQuery.hasNextPage
        : olderCursor != null &&
          (olderQuery.data == null || olderQuery.hasNextPage),
    isLoadingPreviousMessages: previousQuery.isFetchingNextPage,
    loadPreviousMessages: handleLoadPreviousMessages,
    loadNewerMessages: handleLoadNewerMessages,
    isPending: chatRoomQuery.isPending,
    isFetching: chatRoomQuery.isFetching,
    initialError: chatRoomQuery.data == null ? chatRoomQuery.error : null,
    refetch: chatRoomQuery.refetch,
  };
}
