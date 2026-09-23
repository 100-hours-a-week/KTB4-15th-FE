"use client";

import { useEffect, useRef, useState } from "react";
import type {
  ChatMessageResponse,
  ChatSourceType,
  CreateChatRoomRequest,
} from "./api/chat-api.types";
import styles from "./chat-screen.module.scss";
import { AI_MESSAGE_FIXTURE } from "./fixtures/chat.fixture";
import { ChatComposer } from "./ui/composer/chat-composer";
import { ChatIntro } from "./ui/intro/chat-intro";
import { ChatMessageList } from "./ui/message/chat-message-list";

const MOCK_GENERATION_DELAY = 2400;

type ChatScreenProps = {
  date?: string;
  initialMessages?: ChatMessageResponse[];
};

export function ChatScreen({ date, initialMessages = [] }: ChatScreenProps) {
  const [messages, setMessages] =
    useState<ChatMessageResponse[]>(initialMessages);
  const [isGenerating, setIsGenerating] = useState(false);
  const generationTimerRef = useRef<number>(undefined);

  useEffect(() => {
    return () => window.clearTimeout(generationTimerRef.current);
  }, []);

  const handleSubmit = async (
    content: string,
    sourceType: ChatSourceType = "GENERAL",
  ) => {
    const request = {
      content,
      sourceType,
    } satisfies CreateChatRoomRequest;

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        messageId: Date.now(),
        senderType: "USER",
        content: request.content,
        createdAt: new Date().toISOString(),
      },
    ]);
    setIsGenerating(true);

    generationTimerRef.current = window.setTimeout(() => {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          ...AI_MESSAGE_FIXTURE,
          messageId: Date.now(),
          createdAt: new Date().toISOString(),
        },
      ]);
      setIsGenerating(false);
    }, MOCK_GENERATION_DELAY);
  };

  return (
    <>
      {messages.length === 0 && date != null ? (
        <ChatIntro date={date} onSelectQuestion={handleSubmit} />
      ) : (
        <ChatMessageList isGenerating={isGenerating} messages={messages} />
      )}
      <div className={styles.composerDock}>
        <ChatComposer isSubmitting={isGenerating} onSubmit={handleSubmit} />
      </div>
    </>
  );
}
