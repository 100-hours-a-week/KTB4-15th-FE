import { http, HttpResponse } from "msw";
import { handlers } from "../../../src/mocks/handlers.ts";
import {
  createdAt,
  partialReply,
  products,
  reply,
  type Scenario,
  type MockChatRoom,
} from "../data/chat.ts";

let scenario: Scenario = {};
let rooms = new Map<number, MockChatRoom>();
let wishlistProductIds = new Set<number>();
let fittingProductIds = new Set<number>();
let finishStream: (() => void) | undefined;
export let requests: Array<{ method: string; path: string; body: unknown }> =
  [];
export let unhandled: string[] = [];

function success(data: unknown) {
  return HttpResponse.json({ code: "SUCCESS", data, message: "성공" });
}

function failure(message: string, status = 503, code = "TEST_FAILURE") {
  return HttpResponse.json({ code, data: null, message }, { status });
}

function consumeFailure(
  key: "failCreate" | "failMessage" | "failWishlist" | "failFitting",
) {
  const fail = scenario[key];
  scenario[key] = false;
  return fail;
}

function addMessage(content: string, chatRoomId: number) {
  const room = rooms.get(chatRoomId)!;
  const messageId =
    Math.max(0, ...room.messages.map((item) => item.messageId)) + 1;
  room.messages.push({
    messageId,
    content,
    createdAt,
    senderType: "USER",
    generationStatus: "PENDING",
    recommendation: null,
  });
  return { chatRoomId, messageId, content, createdAt };
}

function currentProducts() {
  return products.map((product) => ({
    ...product,
    isWishlisted: wishlistProductIds.has(product.productId),
    wishlistId: wishlistProductIds.has(product.productId)
      ? product.productId + 1000
      : null,
    isFittingCandidate: fittingProductIds.has(product.productId),
    fittingCandidateId: fittingProductIds.has(product.productId)
      ? product.productId
      : null,
  }));
}

export const testHandlers = [
  http.get("*/members/me", ({ request }) => {
    if (!scenario.memberStatus) return;
    if (scenario.memberStatus === "unavailable")
      return failure("인증 서버 오류");
    return scenario.memberStatus === "unauthenticated" ||
      (scenario.memberStatus === "refreshable" &&
        !request.headers.get("cookie")?.includes("accessToken=refreshed"))
      ? failure("로그인 필요", 401, "UNAUTHORIZED")
      : success({ profileCompleted: scenario.memberStatus !== "incomplete" });
  }),
  http.get("*/health", () => new HttpResponse("OK")),
  http.post("*/auth/refresh", () =>
    scenario.expiredRefresh
      ? failure("세션 만료", 401, "UNAUTHORIZED")
      : scenario.memberStatus === "refreshable"
        ? HttpResponse.json(
            { code: "SUCCESS", data: null, message: "성공" },
            {
              headers: {
                "Set-Cookie":
                  "accessToken=refreshed; Path=/; HttpOnly; SameSite=Lax",
              },
            },
          )
        : success(null),
  ),
  http.post("*/__test/reset", async ({ request }) => {
    finishStream?.();
    scenario = (await request.json()) as Scenario;
    rooms = new Map(scenario.rooms?.map((room) => [room.chatRoomId, room]));
    wishlistProductIds = new Set();
    fittingProductIds = new Set();
    requests = [];
    unhandled = [];
    return success(null);
  }),
  http.get("*/__test/requests", () => success({ requests, unhandled })),
  http.post("*/__test/finish-stream", () => {
    if (!finishStream) return failure("진행 중인 스트림이 없습니다.");
    finishStream();
    return success(null);
  }),
  http.post("*/__test/scenario", async ({ request }) => {
    scenario = {
      ...scenario,
      ...((await request.json()) as Partial<Scenario>),
    };
    return success(null);
  }),
  http.get("*/chat-rooms", ({ request }) => {
    const cursor = Number(new URL(request.url).searchParams.get("cursor"));
    if (scenario.failRoomList || (cursor && scenario.failRoomListPage))
      return failure("목록 조회 실패");
    const sorted = [...rooms.values()]
      .sort((a, b) => b.chatRoomId - a.chatRoomId)
      .filter((room) => !cursor || room.chatRoomId < cursor);
    const items = sorted.slice(0, 20).map(({ chatRoomId, title }) => ({
      chatRoomId,
      title,
      lastMessageAt: createdAt,
    }));
    return success({
      items,
      nextCursor: sorted.length > 20 ? items.at(-1)!.chatRoomId : null,
      hasNext: sorted.length > 20,
    });
  }),
  http.post("*/chat-rooms", async ({ request }) => {
    if (scenario.roomLimit)
      return failure("채팅방 한도 초과", 409, "CHAT_ROOM_LIMIT_EXCEEDED");
    if (consumeFailure("failCreate"))
      return failure("메시지를 보내지 못했어요.");
    const { content } = (await request.json()) as { content: string };
    const chatRoomId = Math.max(0, ...rooms.keys()) + 1;
    rooms.set(chatRoomId, { chatRoomId, title: "슬랙스 추천", messages: [] });
    return success(addMessage(content, chatRoomId));
  }),
  http.post("*/chat-rooms/:roomId/messages", async ({ request, params }) => {
    if (scenario.roomLimit)
      return failure("채팅방 한도 초과", 400, "CHAT_ROOM_LIMIT_EXCEEDED");
    if (consumeFailure("failMessage"))
      return failure("메시지를 보내지 못했어요.");
    const chatRoomId = Number(params.roomId);
    if (!rooms.has(chatRoomId))
      return failure("채팅방 없음", 404, "CHAT_ROOM_NOT_FOUND");
    const { content } = (await request.json()) as { content: string };
    return success(addMessage(content, chatRoomId));
  }),
  http.get("*/chat-rooms/:roomId", ({ request, params }) => {
    if (scenario.deniedRoom)
      return failure("접근 불가", 403, "CHAT_ROOM_ACCESS_DENIED");
    const room = rooms.get(Number(params.roomId));
    if (!room) return failure("채팅방 없음", 404, "CHAT_ROOM_NOT_FOUND");
    const cursor = Number(new URL(request.url).searchParams.get("cursor"));
    if (scenario.failRoomDetail || (cursor && scenario.failHistory))
      return failure("메시지 조회 실패");
    const all = room.messages.filter(
      (item) => !cursor || item.messageId < cursor,
    );
    const page = all.slice(-20);
    return success({
      chatRoomId: room.chatRoomId,
      title: room.title,
      messages: page.map((item) =>
        item.senderType === "AI" && item.recommendation
          ? {
              ...item,
              recommendation: {
                ...item.recommendation,
                products: scenario.noProducts ? [] : currentProducts(),
              },
            }
          : item,
      ),
      nextCursor: all.length > 20 ? page[0].messageId : null,
      hasNext: all.length > 20,
    });
  }),
  http.patch("*/chat-rooms/:roomId", async ({ request, params }) => {
    if (scenario.failRename) return failure("이름 수정 실패");
    const room = rooms.get(Number(params.roomId));
    if (!room) return failure("채팅방 없음", 404);
    const { title } = (await request.json()) as { title: string };
    if (!title.trim() || title.length > 20) return failure("잘못된 제목", 400);
    room.title = title;
    return success({ chatRoomId: room.chatRoomId, title });
  }),
  http.delete("*/chat-rooms/:roomId", ({ params }) => {
    if (scenario.failDeleteRoom) return failure("삭제 실패");
    if (!rooms.delete(Number(params.roomId)))
      return failure("채팅방 없음", 404);
    return new HttpResponse(null, { status: 204 });
  }),
  http.get("*/chat-rooms/:roomId/messages/:messageId/stream", ({ params }) => {
    const messages = rooms.get(Number(params.roomId))?.messages ?? [];
    const userMessage = messages.find(
      (item) => item.messageId === Number(params.messageId),
    );
    if (!userMessage || userMessage.senderType !== "USER")
      return failure("메시지가 없습니다.");
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const emit = (event: string, data: object) =>
          controller.enqueue(
            encoder.encode(
              `event: ${event}\ndata: ${JSON.stringify({ userMessageId: userMessage.messageId, ...data })}\n\n`,
            ),
          );
        emit("connected", {});
        emit(scenario.snapshot ? "snapshot" : "token", {
          content: partialReply,
        });
        finishStream = () => {
          finishStream = undefined;
          if (scenario.streamFailure) {
            userMessage.generationStatus = "FAILED";
            if (scenario.streamFailure === "mismatch")
              emit("token", { userMessageId: 9999, content: "다른 메시지" });
            if (scenario.streamFailure === "malformed")
              controller.enqueue(
                encoder.encode("event: token\ndata: invalid-json\n\n"),
              );
            if (scenario.streamFailure === "error") {
              emit("error", {
                code: "AI_ERROR",
                message: "AI 응답을 완료하지 못했어요.",
              });
            }
            scenario.streamFailure = undefined;
          } else {
            userMessage.generationStatus = "COMPLETED";
            messages.push({
              messageId:
                Math.max(...messages.map((item) => item.messageId)) + 1,
              senderType: "AI",
              generationStatus: null,
              content: reply,
              createdAt,
              recommendation: scenario.noProducts
                ? null
                : { recommendationId: 1, products },
            });
            emit("token", { content: reply.slice(partialReply.length) });
            emit("done", {
              content: reply,
              products: scenario.noProducts ? [] : products,
            });
          }
          controller.close();
        };
      },
      cancel() {
        finishStream = undefined;
      },
    });
    return new HttpResponse(stream, {
      headers: { "Content-Type": "text/event-stream" },
    });
  }),
  http.get("*/wishlists/count", () =>
    scenario.failWishlistCount
      ? failure("찜 개수 조회 실패")
      : success({ count: scenario.wishlistCount ?? wishlistProductIds.size }),
  ),
  http.post("*/wishlists", async ({ request }) => {
    if (scenario.wishlistLimit)
      return failure("찜 한도 초과", 400, "WISHLIST_LIMIT_EXCEEDED");
    if (consumeFailure("failWishlist"))
      return failure("찜 목록에 추가하지 못했어요.");
    const { productId } = (await request.json()) as { productId: number };
    if (!products.some((item) => item.productId === productId))
      return failure("알 수 없는 상품");
    wishlistProductIds.add(productId);
    return success({ wishlistId: productId + 1000, productId });
  }),
  http.delete("*/wishlists/:wishlistId", ({ params }) => {
    // DELETE는 API Client가 재시도하므로 의도한 실패는 계속 반환한다.
    if (scenario.failDeleteWishlist) return failure("찜을 해제하지 못했어요.");
    const productId = Number(params.wishlistId) - 1000;
    if (!wishlistProductIds.delete(productId))
      return failure("찜한 상품이 없습니다.", 404);
    return new HttpResponse(null, { status: 204 });
  }),
  http.get("*/wishlists", () => {
    const items = products
      .filter((item) => wishlistProductIds.has(item.productId))
      .map((product) => ({
        ...product,
        wishlistId: product.productId + 1000,
        wishedPrice: product.currentPrice,
        priceChangeRate: 0,
        wishedAt: createdAt,
      }));
    return success({
      items,
      totalCount: items.length,
      nextCursor: null,
      hasNext: false,
    });
  }),
  http.post("*/fitting-candidates", async ({ request }) => {
    if (consumeFailure("failFitting"))
      return failure("피팅 목록에 추가하지 못했어요.");
    const { productId } = (await request.json()) as { productId: number };
    if (!products.some((item) => item.productId === productId))
      return failure("알 수 없는 상품");
    fittingProductIds.add(productId);
    return success({ fittingCandidateId: productId, productId });
  }),
  http.get("*/fitting-candidates", () => {
    const items = products
      .filter((item) => fittingProductIds.has(item.productId))
      .map((product) => ({
        ...product,
        fittingCandidateId: product.productId,
      }));
    return success({
      items,
      totalCount: items.length,
      nextCursor: null,
      hasNext: false,
    });
  }),
  http.get("*/fitting-jobs/current", () =>
    scenario.failCurrentFitting
      ? failure("피팅 작업 조회 실패")
      : success(
          scenario.generatingFitting
            ? {
                fittingJobId: 123,
                status: "GENERATING",
                createdAt,
                resultViewed: false,
                products: [],
              }
            : null,
        ),
  ),
  http.post("*/products/:productId/purchase-link-clicks", () => success(null)),
  http.get("*/notifications/unread", async () => {
    if (scenario.notificationUnreadDelayMs) {
      await new Promise((resolve) =>
        setTimeout(resolve, scenario.notificationUnreadDelayMs),
      );
    }
    return scenario.failNotificationUnread
      ? failure("알림 여부 조회 실패")
      : success({ hasUnread: scenario.hasUnreadNotifications ?? false });
  }),
  http.get(
    "*/notifications/stream",
    () =>
      new HttpResponse(
        new ReadableStream({
          start(controller) {
            controller.enqueue(
              new TextEncoder().encode(
                'event: connected\ndata: {"code":"NOTIFICATION_STREAM_CONNECTED","data":{"unreadCount":0,"hasUnread":false},"message":"연결되었습니다."}\n\n',
              ),
            );
          },
        }),
        {
          headers: { "Content-Type": "text/event-stream" },
        },
      ),
  ),
  ...handlers,
];
