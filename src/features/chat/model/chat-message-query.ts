import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { connectChatStream, sendChatMessage } from "../api/chat";
import { chatRoomQueryKeys } from "./chat-room-query";
import { takeChatStreamChunk } from "./chat-stream-buffer";

const STREAM_RENDER_INTERVAL_MS = 36;
const RECOMMENDATION_REVEAL_DELAY_MS = 200;

export function useChatMessageStream(
  chatRoomId: number,
  messageId?: number | null,
) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<{
    messageId: number;
    content: string;
    error: Error | null;
  } | null>(null);

  useEffect(() => {
    if (messageId == null) {
      return;
    }

    const controller = new AbortController();
    let displayedContent = "";
    let pendingContent = "";
    let isDone = false;
    let didFinish = false;
    let hasProducts = false;
    let completionTimerId: number | undefined;

    const invalidateChatRoom = () =>
      queryClient.invalidateQueries({
        queryKey: chatRoomQueryKeys.detail(chatRoomId),
      });

    const displayTimerId = window.setInterval(() => {
      const [nextChunk, remainingContent] = takeChatStreamChunk(pendingContent);

      if (nextChunk) {
        displayedContent += nextChunk;
        pendingContent = remainingContent;
        setState({ messageId, content: displayedContent, error: null });
        return;
      }

      if (isDone && !didFinish) {
        didFinish = true;
        window.clearInterval(displayTimerId);
        completionTimerId = window.setTimeout(
          () => void invalidateChatRoom(),
          hasProducts ? RECOMMENDATION_REVEAL_DELAY_MS : 0,
        );
      }
    }, STREAM_RENDER_INTERVAL_MS);

    const consume = async () => {
      try {
        for await (const event of connectChatStream(
          chatRoomId,
          messageId,
          controller.signal,
        )) {
          if (event.userMessageId !== messageId) {
            throw new Error("요청한 메시지와 스트림 응답이 일치하지 않습니다.");
          }

          if (event.type === "snapshot") {
            displayedContent = event.content;
            pendingContent = "";
            setState({ messageId, content: event.content, error: null });
          } else if (event.type === "token") {
            pendingContent += event.content;
          } else if (event.type === "done") {
            const receivedContent = displayedContent + pendingContent;

            if (event.content.startsWith(receivedContent)) {
              pendingContent += event.content.slice(receivedContent.length);
            }

            hasProducts = event.products.length > 0;
            isDone = true;
            return;
          } else if (event.type === "error") {
            window.clearInterval(displayTimerId);
            setState((current) => ({
              messageId,
              content: current?.messageId === messageId ? current.content : "",
              error: new Error(event.message),
            }));
            await invalidateChatRoom();
            return;
          }
        }

        if (!controller.signal.aborted) {
          throw new Error("AI 응답 연결이 완료 이벤트 없이 종료되었습니다.");
        }
      } catch (caught) {
        if (controller.signal.aborted) {
          return;
        }

        window.clearInterval(displayTimerId);
        setState((current) => ({
          messageId,
          content: current?.messageId === messageId ? current.content : "",
          error:
            caught instanceof Error
              ? caught
              : new Error("AI 응답을 불러오지 못했습니다."),
        }));
        await invalidateChatRoom();
      }
    };

    void consume();

    return () => {
      window.clearInterval(displayTimerId);
      window.clearTimeout(completionTimerId);
      controller.abort();
    };
  }, [chatRoomId, messageId, queryClient]);

  return state != null && state.messageId === messageId
    ? state
    : { messageId, content: "", error: null };
}

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
