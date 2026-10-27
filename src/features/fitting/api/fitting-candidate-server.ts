import "server-only";

import { parseResponse } from "@/shared/api/response";
import { serverApi } from "@/shared/api/server";
import type { ProductItemType } from "@/shared/schema/product";
import { fittingCandidateListResponse } from "../schema/fitting-candidate";

export async function getFittingCandidatesServer(itemType?: ProductItemType) {
  const searchParams = new URLSearchParams({ size: "20" });
  if (itemType) searchParams.set("itemType", itemType);

  const response = await serverApi(`fitting-candidates?${searchParams}`, {
    cache: "no-store",
  });
  return parseResponse(response, fittingCandidateListResponse);
}
