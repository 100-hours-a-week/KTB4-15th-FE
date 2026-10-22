import "server-only";

import { parseResponse } from "@/shared/api/response";
import { serverApi } from "@/shared/api/server";
import { wishlistListResponse } from "../schema/wishlist";

export async function getWishlistsServer() {
  const response = await serverApi("wishlists?size=20", {
    cache: "no-store",
  });

  return parseResponse(response, wishlistListResponse);
}
