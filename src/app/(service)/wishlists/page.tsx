import { getWishlistsServer } from "@/features/wishlist/api/wishlist-server";
import { WishlistScreen } from "@/features/wishlist";
import { WishlistCard } from "@/features/wishlist/ui/wishlist-card";
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
        <WishlistScreen
          initialCards={initialPage?.items.map((product, index) => (
            <WishlistCard
              key={product.wishlistId}
              preload={index === 0}
              product={product}
            />
          ))}
          initialPage={initialPage}
        />
      </main>
    </>
  );
}
