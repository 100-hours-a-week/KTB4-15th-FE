import { ChatHeader, ChatScreen } from "@/features/chat";
import styles from "../page.module.scss";

export default function ChatRoomPage() {
  return (
    <>
      <ChatHeader />
      <main className={styles.main}>
        <ChatScreen initialMessages={[]} />
      </main>
    </>
  );
}
