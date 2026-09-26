import { queryOptions } from "@tanstack/react-query";
import { getMemberMe } from "./member";

export const memberMeQueryOptions = queryOptions({
  queryKey: ["member", "me"],
  queryFn: getMemberMe,
  staleTime: 5 * 60 * 1000,
});
