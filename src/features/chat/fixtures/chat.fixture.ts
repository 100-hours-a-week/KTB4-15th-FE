import type { ChatMessageResponse } from "../api/chat-api.types";
import { CHAT_GENERATION_COMPLETED_FIXTURE } from "./chat-generation.fixture";

const USER_MESSAGE_FIXTURE: ChatMessageResponse = {
  messageId: 501,
  senderType: "USER",
  content:
    "출근이랑 주말에 편하게 입을 수 있는 5~8만원대 자켓이랑 니트 추천해줘!",
  createdAt: "2026-09-21T10:23:00+09:00",
};

const completedMessage = CHAT_GENERATION_COMPLETED_FIXTURE.data.message;

export const AI_MESSAGE_FIXTURE = completedMessage;

export const CHAT_MESSAGE_FIXTURE: ChatMessageResponse[] = [
  USER_MESSAGE_FIXTURE,
  AI_MESSAGE_FIXTURE,
];
