import { notFound } from "next/navigation";
import { ChatHeader, ChatRoomScreen } from "@/features/chat";
import styles from "../page.module.scss";

export async function generateMetadata({
  params,
}: PageProps<"/chat/[chatId]">) {
  const id = Number((await params).chatId);
  const title =
    Number.isInteger(id) && id > 0 ? "채팅 대화" : "페이지를 찾을 수 없음";
  return { title: `${title} | LOOK DDAK` };
}

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

  return (
    <>
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
