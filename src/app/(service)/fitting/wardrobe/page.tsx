import { Suspense } from "react";
import { FittingWardrobeScreen } from "@/features/fitting/ui/wardrobe/fitting-wardrobe-screen";
import { FittingWardrobePageSkeleton } from "@/features/fitting/ui/wardrobe/fitting-wardrobe-skeleton";
import { getFittingCandidatesServer } from "@/features/fitting/api/fitting-candidate-server";
import {
  isServerUnauthorizedError,
  redirectOnServerUnauthorized,
} from "@/shared/api/server";
import type { ProductItemType } from "@/shared/schema/product";

async function Screen({
  initialFilter,
}: {
  initialFilter: ProductItemType | "ALL";
}) {
  const initialCandidates = await getFittingCandidatesServer(
    initialFilter === "ALL" ? undefined : initialFilter,
  ).catch((error: unknown) => {
    if (isServerUnauthorizedError(error)) {
      return redirectOnServerUnauthorized(error);
    }
  });

  return (
    <FittingWardrobeScreen
      initialCandidates={initialCandidates}
      initialFilter={initialFilter}
    />
  );
}

export default async function FittingWardrobePage({
  searchParams,
}: PageProps<"/fitting/wardrobe">) {
  const { itemType } = await searchParams;
  const initialFilter =
    itemType === "TOP" || itemType === "BOTTOM" ? itemType : "ALL";

  return (
    <Suspense fallback={<FittingWardrobePageSkeleton />}>
      <Screen initialFilter={initialFilter} />
    </Suspense>
  );
}
