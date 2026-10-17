import { WishlistScreen } from "@/features/wishlist";
import { Header, HeaderTitle, NotificationLink } from "@/shared/ui/header";

export default function WishlistsPage() {
  return (
    <>
      <Header
        left={<HeaderTitle>찜</HeaderTitle>}
        right={<NotificationLink />}
      />
      <WishlistScreen />
    </>
  );
}
