import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { getChatMessageGenerationStatus, sendChatMessage } from "../api/chat";
import { chatRoomQueryKeys } from "./chat-room-query";

export const chatMessageQueryKeys = {
  generationStatus: (chatRoomId?: number, messageId?: number | null) =>
    ["chat", "message", "generation", "status", chatRoomId, messageId] as const,
};

export const chatMessageGenerationStatusQueryOptions = (
  chatRoomId?: number,
  messageId?: number | null,
) =>
  queryOptions({
    queryKey: chatMessageQueryKeys.generationStatus(chatRoomId, messageId),
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

export function useSendChatMessageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      chatRoomId,
      content,
    }: {
      chatRoomId: number;
      content: string;
    }) => sendChatMessage(chatRoomId, { content }),
    onSuccess: (_, { chatRoomId }) =>
      queryClient.invalidateQueries({
        queryKey: chatRoomQueryKeys.detail(chatRoomId),
      }),
  });
}
