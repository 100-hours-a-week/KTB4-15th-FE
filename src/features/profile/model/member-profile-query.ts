import { queryOptions } from "@tanstack/react-query";
import { getMemberProfile } from "../api/profile";

export const memberProfileQueryOptions = queryOptions({
  queryKey: ["member", "profile"],
  queryFn: getMemberProfile,
  staleTime: 5 * 60 * 1000,
});
