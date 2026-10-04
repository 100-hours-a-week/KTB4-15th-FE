import {
  infiniteQueryOptions,
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  deleteChatRoom,
  getChatMessageGenerationStatus,
  getChatRoom,
  getChatRooms,
  renameChatRoom,
} from "../api/chat";

export const chatQueryKeys = {
  roomList: ["chat", "rooms"] as const,
  room: (chatRoomId?: number) => ["chat", "room", chatRoomId] as const,
  messageGenerationStatus: (chatRoomId?: number, messageId?: number | null) =>
    ["chat", "message", "generation", "status", chatRoomId, messageId] as const,
};

export const chatRoomListQueryOptions = infiniteQueryOptions({
  queryKey: chatQueryKeys.roomList,
  queryFn: ({ pageParam }) => getChatRooms(pageParam),
  initialPageParam: null as number | null,
  getNextPageParam: (lastPage) =>
    lastPage.hasNext && lastPage.nextCursor !== null
      ? lastPage.nextCursor
      : undefined,
});

export const chatRoomQueryOptions = (chatRoomId?: number) =>
  infiniteQueryOptions({
    queryKey: chatQueryKeys.room(chatRoomId),
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
    retry: false,
  });

export const chatMessageGenerationStatusQueryOptions = (
  chatRoomId?: number,
  messageId?: number | null,
) =>
  queryOptions({
    queryKey: chatQueryKeys.messageGenerationStatus(chatRoomId, messageId),
    queryFn: () => {
      if (chatRoomId == null || messageId == null) {
        throw new Error("폴링에 필요한 ID가 없습니다.");
      }

      return getChatMessageGenerationStatus(chatRoomId, messageId);
    },
    enabled: chatRoomId != null && messageId != null,
    refetchInterval: (query) =>
      query.state.data?.generationStatus === "GENERATING" ? 2_000 : false,
  });

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
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.roomList }),
  });
}

export function useDeleteChatRoomMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteChatRoom,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.roomList }),
  });
}
