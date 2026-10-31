import { connection } from "next/server";
import { ChatHeader, NewChatScreen } from "@/features/chat";
import { getMemberProfileServer } from "@/features/profile/api/member-profile-server";
import { getWishlistCountServer } from "@/features/wishlist/api/wishlist-server";
import {
  isServerUnauthorizedError,
  redirectOnServerUnauthorized,
} from "@/shared/api/server";
import { formatKoreanDate } from "@/shared/utils/date-format";
import styles from "./page.module.scss";

async function optionalServerData<T>(request: Promise<T>) {
  try {
    return await request;
  } catch (error) {
    if (isServerUnauthorizedError(error)) {
      return redirectOnServerUnauthorized(error);
    }
  }
}

export default async function ChatPage() {
  await connection();
  const [wishlistCount, memberProfile] = await Promise.all([
    optionalServerData(getWishlistCountServer()),
    optionalServerData(getMemberProfileServer()),
  ]);

  return (
    <>
      <ChatHeader />
      <main className={styles.main}>
        <NewChatScreen
          date={formatKoreanDate(new Date())}
          memberName={memberProfile?.name}
          showWishlistQuestion={(wishlistCount?.count ?? 0) >= 10}
        />
      </main>
    </>
  );
}
