import { notFound } from "next/navigation";
import { ChatHeader, ChatRoomScreen } from "@/features/chat";
import styles from "../page.module.scss";

export default async function ChatRoomPage({
  params,
  searchParams,
}: PageProps<"/chat/[chatId]">) {
  const { chatId } = await params;
  const chatRoomId = Number(chatId);
  const { messageId } = await searchParams;
  const target = typeof messageId === "string" ? Number(messageId) : NaN;
  const anchorMessageId =
    Number.isSafeInteger(target) && target > 0 ? target : undefined;

  if (!Number.isInteger(chatRoomId) || chatRoomId <= 0) {
    notFound();
  }

  return (
    <>
      <ChatHeader />
      <main className={styles.main}>
        <ChatRoomScreen
          key={`${chatRoomId}:${anchorMessageId}`}
          chatRoomId={chatRoomId}
          anchorMessageId={anchorMessageId}
        />
      </main>
    </>
  );
}
