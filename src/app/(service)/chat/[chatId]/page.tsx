import { notFound } from "next/navigation";
import { ChatHeader, ChatRoomScreen } from "@/features/chat";
import styles from "../page.module.scss";

export default async function ChatRoomPage({
  params,
}: PageProps<"/chat/[chatId]">) {
  const { chatId } = await params;
  const chatRoomId = Number(chatId);

  if (!Number.isInteger(chatRoomId) || chatRoomId <= 0) {
    notFound();
  }

  return (
    <>
      <ChatHeader />
      <main className={styles.main}>
        <ChatRoomScreen chatRoomId={chatRoomId} />
      </main>
    </>
  );
}
