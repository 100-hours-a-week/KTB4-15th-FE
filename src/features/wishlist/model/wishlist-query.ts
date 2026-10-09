import {
  infiniteQueryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { createWishlist, deleteWishlist, getWishlists } from "../api/wishlist";

export const wishlistQueryKeys = {
  root: ["wishlists"] as const,
  list: ["wishlists", "list"] as const,
};

export const wishlistListQueryOptions = infiniteQueryOptions({
  queryKey: wishlistQueryKeys.list,
  queryFn: ({ pageParam }) => getWishlists({ cursor: pageParam, size: 20 }),
  initialPageParam: undefined as number | undefined,
  getNextPageParam: (lastPage) =>
    lastPage.hasNext ? (lastPage.nextCursor ?? undefined) : undefined,
});

function useInvalidateWishlists() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: wishlistQueryKeys.root });
}

export function useCreateWishlistMutation(invalidateOnSuccess = true) {
  const invalidate = useInvalidateWishlists();
  return useMutation({
    mutationFn: createWishlist,
    networkMode: "always",
    onSuccess: invalidateOnSuccess ? invalidate : undefined,
  });
}

export function useDeleteWishlistMutation(invalidateOnSuccess = true) {
  const invalidate = useInvalidateWishlists();
  return useMutation({
    mutationFn: deleteWishlist,
    networkMode: "always",
    onSuccess: invalidateOnSuccess ? invalidate : undefined,
  });
}
