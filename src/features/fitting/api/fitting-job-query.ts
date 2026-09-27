import { useQuery } from "@tanstack/react-query";
import { getFittingJobStatus } from "./fitting-jobs";

export function useFittingJobStatusQuery(fittingJobId: number) {
  return useQuery({
    queryKey: ["fitting-jobs", fittingJobId],
    queryFn: () => getFittingJobStatus(fittingJobId),
    refetchInterval: (query) =>
      query.state.data?.status === "GENERATING" ? 3_000 : false,
    refetchOnWindowFocus: true,
  });
}
