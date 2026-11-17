import { WishlistSkeleton } from "@/features/wishlist/ui/wishlist-skeleton";
import { Header } from "@/shared/ui/header/header";
import { HeaderTitle } from "@/shared/ui/header/header-title";
import { NotificationLink } from "@/shared/ui/header/header-actions";
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
