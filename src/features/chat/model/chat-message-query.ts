import { useEffect, useState } from "react";
import { getApiErrorMessage } from "@/shared/api/error";
import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import {
  connectChatStream,
  getChatGenerationStatus,
  sendChatMessage,
} from "../api/chat";
import { chatRoomQueryKeys } from "./chat-room-query";
import { takeChatStreamChunk } from "./chat-stream-buffer";

import { updateChatGenerationCache } from "./chat-message-cache";
import type {
  ChatMessageContextResponse,
  ChatGenerationStatusResponse,
} from "../schema/chat";

const STREAM_RENDER_INTERVAL_MS = 36;
const RECOMMENDATION_REVEAL_DELAY_MS = 200;

export function useChatMessageStream(
  chatRoomId: number,
  messageId?: number | null,
) {
  const queryClient = useQueryClient();
  const [retryRequest, setRetryRequest] = useState<{
    messageId: number;
  } | null>(null);
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

    let completedStatus: ChatGenerationStatusResponse | undefined;
    let reconnectTimerId: number | undefined;

    const applyStatus = async (status: ChatGenerationStatusResponse) => {
      const detailQuery = { queryKey: chatRoomQueryKeys.detail(chatRoomId) };
      // Pagination builds on the old pages, so let it finish before patching them.
      const pagination = queryClient
        .getQueryCache()
        .findAll({ ...detailQuery, type: "active", fetchStatus: "fetching" })
        .filter((query) => query.state.fetchMeta?.fetchMore != null);
      if (pagination.length > 0) {
        await Promise.allSettled(pagination.map((query) => query.promise));
      }
      if (controller.signal.aborted) return;
      await queryClient.cancelQueries(detailQuery);
      if (controller.signal.aborted) return;
      queryClient.setQueriesData<InfiniteData<ChatMessageContextResponse>>(
        detailQuery,
        (data) => updateChatGenerationCache(data, messageId, status),
      );
      if (status.generationStatus === "COMPLETED") {
        void queryClient.invalidateQueries({
          queryKey: chatRoomQueryKeys.search,
        });
      }
    };

    const waitForReconnect = () =>
      new Promise<void>((resolve) => {
        const finish = () => {
          window.clearTimeout(reconnectTimerId);
          controller.signal.removeEventListener("abort", finish);
          resolve();
        };
        controller.signal.addEventListener("abort", finish, { once: true });
        reconnectTimerId = window.setTimeout(finish, 1000);
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
          () => {
            if (completedStatus) void applyStatus(completedStatus);
          },
          hasProducts ? RECOMMENDATION_REVEAL_DELAY_MS : 0,
        );
      }
    }, STREAM_RENDER_INTERVAL_MS);

    const checkStatusBeforeConnecting = retryRequest?.messageId === messageId;
    const consume = async () => {
      for (
        let reconnectAttempt = checkStatusBeforeConnecting ? -1 : 0;
        !controller.signal.aborted;
        reconnectAttempt++
      ) {
        let caught: unknown = new Error("AI 응답을 불러오지 못했습니다.");
        if (reconnectAttempt >= 0) {
          try {
            for await (const event of connectChatStream(
              chatRoomId,
              messageId,
              controller.signal,
            )) {
              if (event.userMessageId !== messageId) {
                throw new Error(
                  "요청한 메시지와 스트림 응답이 일치하지 않습니다.",
                );
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

                completedStatus = await getChatGenerationStatus(
                  chatRoomId,
                  messageId,
                  controller.signal,
                );
                if (controller.signal.aborted) return;
                if (completedStatus.generationStatus !== "COMPLETED") {
                  throw new Error("완료된 AI 답변 상태를 확인하지 못했어요.");
                }
                hasProducts = completedStatus.message.recommendation != null;
                isDone = true;
                return;
              } else if (event.type === "error") {
                throw new Error(event.message);
              }
            }

            if (!controller.signal.aborted) {
              throw new Error(
                "AI 응답 연결이 완료 이벤트 없이 종료되었습니다.",
              );
            }
          } catch (error) {
            caught = error;
          }
        }
        if (controller.signal.aborted) return;

        try {
          const status = await getChatGenerationStatus(
            chatRoomId,
            messageId,
            controller.signal,
          );
          if (controller.signal.aborted) return;
          if (status.generationStatus === "COMPLETED") {
            window.clearInterval(displayTimerId);
            await applyStatus(status);
            return;
          }
          if (status.generationStatus !== "FAILED" && reconnectAttempt < 3) {
            if (reconnectAttempt >= 0) await waitForReconnect();
            if (controller.signal.aborted) return;
            // The reconnect snapshot replaces partial text, so replayed tokens cannot duplicate it.
            displayedContent = "";
            pendingContent = "";
            setState({ messageId, content: "", error: null });
            continue;
          }
          if (status.generationStatus === "FAILED") {
            window.clearInterval(displayTimerId);
            setState((current) => ({
              messageId,
              content: current?.messageId === messageId ? current.content : "",
              error:
                caught instanceof Error
                  ? caught
                  : new Error("AI 응답을 불러오지 못했습니다."),
            }));
            await applyStatus(status);
            return;
          }
        } catch (statusError) {
          if (controller.signal.aborted) return;
          caught = new Error(
            getApiErrorMessage(
              statusError,
              "답변 상태를 확인하지 못했어요. 연결을 다시 시도해 주세요.",
            ),
          );
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
        return;
      }
    };

    void consume();

    return () => {
      window.clearInterval(displayTimerId);
      window.clearTimeout(completionTimerId);
      window.clearTimeout(reconnectTimerId);
      controller.abort();
    };
  }, [chatRoomId, messageId, queryClient, retryRequest]);

  const streamState =
    state != null && state.messageId === messageId
      ? state
      : {
          messageId,
          content: "",
          error: messageId == null ? (state?.error ?? null) : null,
        };

  return {
    ...streamState,
    retry:
      messageId != null && streamState.error != null
        ? () => {
            setState({ messageId, content: "", error: null });
            setRetryRequest({ messageId });
          }
        : undefined,
  };
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
