import { ChatHeader, ChatScreen } from "@/features/chat";
import { CHAT_MESSAGE_FIXTURE } from "@/features/chat/fixtures/chat.fixture";
import styles from "../page.module.scss";

export default function ChatRoomPage() {
  return (
    <>
      <ChatHeader />
      <main className={styles.main}>
        <ChatScreen initialMessages={CHAT_MESSAGE_FIXTURE} />
      </main>
    </>
  );
}
