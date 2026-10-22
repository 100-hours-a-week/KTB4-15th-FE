import { connection } from "next/server";
import { ChatHeader, NewChatScreen } from "@/features/chat";
import { getWishlistCountServer } from "@/features/wishlist/api/wishlist-server";
import {
  isServerUnauthorizedError,
  redirectOnServerUnauthorized,
} from "@/shared/api/server";
import { formatKoreanDate } from "@/shared/utils/date-format";
import styles from "./page.module.scss";

export default async function ChatPage() {
  await connection();
  const showWishlistQuestion = await getWishlistCountServer()
    .then(({ count }) => count >= 10)
    .catch((error: unknown) => {
      if (isServerUnauthorizedError(error)) {
        return redirectOnServerUnauthorized(error);
      }
      return false;
    });

  return (
    <>
      <ChatHeader />
      <main className={styles.main}>
        <NewChatScreen
          date={formatKoreanDate(new Date())}
          showWishlistQuestion={showWishlistQuestion}
        />
      </main>
    </>
  );
}
