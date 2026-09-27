import { FittingWardrobe } from "@/features/fitting";

export default async function FittingWardrobePage({
  searchParams,
}: PageProps<"/fitting/wardrobe">) {
  const { itemType } = await searchParams;
  const initialFilter =
    itemType === "TOP" || itemType === "BOTTOM" ? itemType : "ALL";

  return <FittingWardrobe initialFilter={initialFilter} />;
}
