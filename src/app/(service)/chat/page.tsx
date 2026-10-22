import { connection } from "next/server";
import { ChatHeader, NewChatScreen } from "@/features/chat";
import { formatKoreanDate } from "@/shared/utils/date-format";
import styles from "./page.module.scss";

export default async function ChatPage() {
  await connection();

  return (
    <>
      <ChatHeader />
      <main className={styles.main}>
        <NewChatScreen date={formatKoreanDate(new Date())} />
      </main>
    </>
  );
}
