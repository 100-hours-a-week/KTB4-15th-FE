import { notFound } from "next/navigation";
import { ChatHeader } from "@/features/chat/ui/header/chat-header";
import { ChatRoomScreen } from "@/features/chat/chat-room-screen";
import styles from "../page.module.scss";

export default async function ChatRoomPage({
  params,
  searchParams,
}: PageProps<"/chat/[chatId]">) {
  const { chatId } = await params;
  const chatRoomId = Number(chatId);
  const { messageId, keyword } = await searchParams;
  const target = typeof messageId === "string" ? Number(messageId) : NaN;
  const anchorMessageId =
    Number.isSafeInteger(target) && target > 0 ? target : undefined;

  if (!Number.isInteger(chatRoomId) || chatRoomId <= 0) {
    notFound();
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const initialMessagesUrl =
    process.env.NODE_ENV === "production" &&
    apiBaseUrl &&
    anchorMessageId == null
      ? `${apiBaseUrl.replace(/\/+$/, "")}/chat-rooms/${chatRoomId}/messages?size=20`
      : undefined;

  return (
    <>
      {initialMessagesUrl && (
        <link
          rel="preload"
          as="fetch"
          href={initialMessagesUrl}
          crossOrigin="use-credentials"
        />
      )}
      <ChatHeader />
      <main className={styles.main}>
        <ChatRoomScreen
          key={`${chatRoomId}:${anchorMessageId}`}
          chatRoomId={chatRoomId}
          anchorMessageId={anchorMessageId}
          searchKeyword={
            typeof keyword === "string"
              ? keyword.trim().slice(0, 100)
              : undefined
          }
        />
      </main>
    </>
  );
}
