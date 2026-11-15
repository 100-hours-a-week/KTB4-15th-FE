import { ChatSearchScreen } from "@/features/chat/chat-search-screen";
import { BackButton, Header, HeaderTitle } from "@/shared/ui/header";
import styles from "../../page-layout.module.scss";

export const metadata = {
  title: "대화 검색 | LOOK DDAK",
};

export default function ChatSearchPage() {
  return (
    <>
      <Header
        left={<BackButton />}
        center={<HeaderTitle>채팅 검색</HeaderTitle>}
      />
      <main className={styles.main}>
        <ChatSearchScreen />
      </main>
    </>
  );
}
