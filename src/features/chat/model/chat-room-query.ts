import {
  infiniteQueryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createChatRoom,
  deleteChatRoom,
  getChatRoom,
  getChatRooms,
  renameChatRoom,
} from "../api/chat";

export const chatRoomQueryKeys = {
  list: ["chat", "rooms"] as const,
  search: ["chat", "search"] as const,
  detail: (chatRoomId?: number) => ["chat", "room", chatRoomId] as const,
};

export const chatRoomListQueryOptions = infiniteQueryOptions({
  queryKey: chatRoomQueryKeys.list,
  queryFn: ({ pageParam }) => getChatRooms(pageParam),
  initialPageParam: null as number | null,
  getNextPageParam: (lastPage) =>
    lastPage.hasNext && lastPage.nextCursor !== null
      ? lastPage.nextCursor
      : undefined,
});

export const chatRoomQueryOptions = (
  chatRoomId: number,
  anchorMessageId?: number,
) =>
  infiniteQueryOptions({
    queryKey: [...chatRoomQueryKeys.detail(chatRoomId), anchorMessageId],
    refetchOnWindowFocus: false,
    queryFn: ({ pageParam }) =>
      getChatRoom(
        chatRoomId,
        pageParam != null
          ? anchorMessageId == null
            ? { before: pageParam }
            : { after: pageParam }
          : anchorMessageId == null
            ? null
            : { aroundMessageId: anchorMessageId },
      ),
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) =>
      anchorMessageId == null
        ? lastPage.hasPrevious
          ? lastPage.previousCursor
          : undefined
        : lastPage.hasNext
          ? lastPage.nextCursor
          : undefined,
  });

export const chatRoomOlderQueryOptions = (
  chatRoomId: number,
  cursor: number | null,
) =>
  infiniteQueryOptions({
    queryKey: [...chatRoomQueryKeys.detail(chatRoomId), "before", cursor],
    refetchOnWindowFocus: false,
    queryFn: ({ pageParam }) => {
      if (pageParam == null) throw new Error("이전 메시지 커서가 없습니다.");
      return getChatRoom(chatRoomId, { before: pageParam });
    },
    initialPageParam: cursor,
    getNextPageParam: (lastPage) =>
      lastPage.hasPrevious ? lastPage.previousCursor : undefined,
    enabled: (query) => cursor != null && query.state.data != null,
  });

export function useCreateChatRoomMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createChatRoom,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: chatRoomQueryKeys.list }),
        queryClient.invalidateQueries({ queryKey: chatRoomQueryKeys.search }),
      ]),
  });
}

export function useRenameChatRoomMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      chatRoomId,
      title,
    }: {
      chatRoomId: number;
      title: string;
    }) => renameChatRoom(chatRoomId, { title }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: chatRoomQueryKeys.list }),
        queryClient.invalidateQueries({ queryKey: chatRoomQueryKeys.search }),
      ]),
  });
}

export function useDeleteChatRoomMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteChatRoom,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: chatRoomQueryKeys.list }),
        queryClient.invalidateQueries({ queryKey: chatRoomQueryKeys.search }),
      ]),
  });
}
