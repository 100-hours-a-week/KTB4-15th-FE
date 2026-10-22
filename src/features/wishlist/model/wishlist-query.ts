import {
  infiniteQueryOptions,
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createWishlist,
  deleteWishlist,
  getWishlistCount,
  getWishlists,
} from "../api/wishlist";

export const wishlistQueryKeys = {
  root: ["wishlists"] as const,
  list: ["wishlists", "list"] as const,
  count: ["wishlists", "count"] as const,
};

export const wishlistCountQueryOptions = queryOptions({
  queryKey: wishlistQueryKeys.count,
  queryFn: getWishlistCount,
});

export const wishlistListQueryOptions = infiniteQueryOptions({
  queryKey: wishlistQueryKeys.list,
  queryFn: ({ pageParam }) => getWishlists({ cursor: pageParam, size: 20 }),
  initialPageParam: undefined as number | undefined,
  getNextPageParam: (lastPage) =>
    lastPage.hasNext ? (lastPage.nextCursor ?? undefined) : undefined,
});

function useInvalidateWishlists(invalidateList: boolean) {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      queryKey: invalidateList
        ? wishlistQueryKeys.root
        : wishlistQueryKeys.count,
    });
}

export function useCreateWishlistMutation(invalidateListOnSuccess = true) {
  const invalidate = useInvalidateWishlists(invalidateListOnSuccess);
  return useMutation({
    mutationFn: createWishlist,
    networkMode: "always",
    onSuccess: invalidate,
  });
}

export function useDeleteWishlistMutation(invalidateListOnSuccess = true) {
  const invalidate = useInvalidateWishlists(invalidateListOnSuccess);
  return useMutation({
    mutationFn: deleteWishlist,
    networkMode: "always",
    onSuccess: invalidate,
  });
}
