import { WishlistScreen } from "@/features/wishlist";
import { Header, HeaderTitle, NotificationLink } from "@/shared/ui/header";
import styles from "./page.module.scss";

export default function WishlistsPage() {
  return (
    <>
      <Header
        left={<HeaderTitle>찜</HeaderTitle>}
        right={<NotificationLink />}
      />
      <main className={styles.main}>
        <WishlistScreen />
      </main>
    </>
  );
}
