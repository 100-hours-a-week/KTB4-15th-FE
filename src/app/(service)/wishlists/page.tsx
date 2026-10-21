import { getWishlistsServer } from "@/features/wishlist/api/wishlist-server";
import { WishlistScreen } from "@/features/wishlist";
import {
  isServerUnauthorizedError,
  redirectOnServerUnauthorized,
} from "@/shared/api/server";
import { Header, HeaderTitle, NotificationLink } from "@/shared/ui/header";
import styles from "../page-layout.module.scss";

export default async function WishlistsPage() {
  const initialPage = await getWishlistsServer().catch((error: unknown) => {
    if (isServerUnauthorizedError(error)) {
      return redirectOnServerUnauthorized(error);
    }
  });

  return (
    <>
      <Header
        left={<HeaderTitle>찜</HeaderTitle>}
        right={<NotificationLink />}
      />
      <main className={styles.main}>
        <WishlistScreen initialPage={initialPage} />
      </main>
    </>
  );
}
