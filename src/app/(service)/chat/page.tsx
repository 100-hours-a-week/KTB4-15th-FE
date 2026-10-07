import { connection } from "next/server";
import { ChatHeader, ChatScreen } from "@/features/chat";
import { formatKoreanDate } from "@/shared/utils/date-format";
import styles from "./page.module.scss";

export default async function ChatPage() {
  await connection();

  return (
    <>
      <ChatHeader />
      <main className={styles.main}>
        <ChatScreen date={formatKoreanDate(new Date())} />
      </main>
    </>
  );
}
