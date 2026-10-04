import {
  infiniteQueryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { deleteChatRoom, getChatRooms, renameChatRoom } from "../api/chat";

export const chatQueryKeys = {
  roomList: ["chat", "rooms"] as const,
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
