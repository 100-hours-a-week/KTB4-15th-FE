import { connection } from "next/server";
import { ChatLanding } from "@/features/chat";
import {
  ConversationListButton,
  Header,
  NotificationLink,
} from "@/shared/ui/header";
import styles from "./page.module.scss";

function getCurrentDate() {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());
}

export default async function ChatPage() {
  await connection();

  return (
    <>
      <Header
        center={<h1 className={styles.title}>AI 패션 스타일리스트</h1>}
        left={<ConversationListButton />}
        right={<NotificationLink />}
      />
      <main className={styles.main}>
        <ChatLanding date={getCurrentDate()} />
      </main>
    </>
  );
}
