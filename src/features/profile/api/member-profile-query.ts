import { queryOptions, useQuery } from "@tanstack/react-query";
import { getMemberProfile } from "./profile";

export const memberProfileQueryOptions = queryOptions({
  queryKey: ["memberprofile"],
  queryFn: getMemberProfile,
  staleTime: 5 * 60 * 1000,
});

export function useMemberProfileQuery() {
  return useQuery(memberProfileQueryOptions);
}
