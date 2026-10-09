import { WishlistScreen } from "@/features/wishlist";
import { Header } from "@/shared/ui/header/header";
import { HeaderTitle } from "@/shared/ui/header/header-title";

export default function WishlistsPage() {
  return (
    <>
      <Header left={<HeaderTitle>찜</HeaderTitle>} />
      <WishlistScreen />
    </>
  );
}
