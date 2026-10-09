import { apiClient } from "@/shared/api/client";
import { parseResponse } from "@/shared/api/response";
import {
  wishlistCreateResponse,
  wishlistListResponse,
} from "../schema/wishlist";

type GetWishlistsParams = {
  cursor?: number;
  size?: number;
};

export async function getWishlists({
  cursor,
  size = 20,
}: GetWishlistsParams = {}) {
  const searchParams = new URLSearchParams({ size: String(size) });
  if (cursor) searchParams.set("cursor", String(cursor));

  const response = await apiClient.get("wishlists", { searchParams });
  return parseResponse(response, wishlistListResponse);
}

export async function createWishlist(productId: number) {
  const response = await apiClient.post("wishlists", { json: { productId } });
  return parseResponse(response, wishlistCreateResponse);
}

export async function deleteWishlist(wishlistId: number) {
  await apiClient.delete(`wishlists/${wishlistId}`);
}
