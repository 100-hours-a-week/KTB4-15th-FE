import { WishlistSkeleton } from "@/features/wishlist/ui/wishlist-skeleton";
import { Header, HeaderTitle, NotificationLink } from "@/shared/ui/header";
import styles from "../page-layout.module.scss";

export default function WishlistLoading() {
  return (
    <>
      <Header
        left={<HeaderTitle>찜</HeaderTitle>}
        right={<NotificationLink />}
      />
      <main className={styles.main}>
        <WishlistSkeleton />
      </main>
    </>
  );
}
