import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { createMemberProfile, getMemberProfile } from "../api/profile";

export const memberProfileQueryOptions = queryOptions({
  queryKey: ["member", "profile"],
  queryFn: getMemberProfile,
  staleTime: 5 * 60 * 1000,
});

export function useCreateMemberProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMemberProfile,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: memberProfileQueryOptions.queryKey,
      });
    },
  });
}
