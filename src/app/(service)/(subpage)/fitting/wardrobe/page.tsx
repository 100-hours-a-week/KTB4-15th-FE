import { FittingWardrobe } from "@/features/fitting";
import { Header, HeaderIconLink, HeaderTitle } from "@/shared/ui/header";
import { BackIcon } from "@/shared/ui/icon";

export default async function FittingWardrobePage({
  searchParams,
}: PageProps<"/fitting/wardrobe">) {
  const { itemType } = await searchParams;
  const initialFilter =
    itemType === "TOP" || itemType === "BOTTOM" ? itemType : "ALL";

  return (
    <>
      <Header
        center={<HeaderTitle>피팅 옷장</HeaderTitle>}
        left={
          <HeaderIconLink aria-label="피팅으로 돌아가기" href="/fitting">
            <BackIcon />
          </HeaderIconLink>
        }
      />
      <FittingWardrobe initialFilter={initialFilter} />
    </>
  );
}
