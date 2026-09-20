import { ChatScreen } from "@/features/chat";
import { CHAT_MESSAGE_FIXTURE } from "@/features/chat/fixtures/chat.fixture";
import {
  ConversationListButton,
  Header,
  NotificationLink,
} from "@/shared/ui/header";
import styles from "../chat-page.module.scss";

export default function ChatRoomPage() {
  return (
    <>
      <Header
        center={<h1 className={styles.title}>AI 패션 스타일리스트</h1>}
        left={<ConversationListButton />}
        right={<NotificationLink />}
      />
      <main className={styles.main}>
        <ChatScreen initialMessages={CHAT_MESSAGE_FIXTURE} />
      </main>
    </>
  );
}
