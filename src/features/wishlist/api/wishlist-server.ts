import "server-only";

import { parseResponse } from "@/shared/api/response";
import { serverApi } from "@/shared/api/server";
import {
  wishlistCountResponse,
  wishlistListResponse,
} from "../schema/wishlist";

export async function getWishlistCountServer() {
  const response = await serverApi("wishlists/count", { cache: "no-store" });

  return parseResponse(response, wishlistCountResponse);
}

export async function getWishlistsServer() {
  const response = await serverApi("wishlists?size=20", {
    cache: "no-store",
  });

  return parseResponse(response, wishlistListResponse);
}
