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

export const chatRoomQueryOptions = (chatRoomId?: number) =>
  infiniteQueryOptions({
    queryKey: chatRoomQueryKeys.detail(chatRoomId),
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

export function useCreateChatRoomMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createChatRoom,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: chatRoomQueryKeys.list }),
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
      queryClient.invalidateQueries({ queryKey: chatRoomQueryKeys.list }),
  });
}

export function useDeleteChatRoomMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteChatRoom,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: chatRoomQueryKeys.list }),
  });
}
