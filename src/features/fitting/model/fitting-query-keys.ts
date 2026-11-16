import type { ProductItemType } from "@/shared/schema/product";

export const fittingQueryKeys = {
  candidateListRoot: ["fitting", "candidates"] as const,
  candidateList: (itemType?: ProductItemType) =>
    [...fittingQueryKeys.candidateListRoot, itemType ?? "all"] as const,
  currentJob: ["fitting", "job", "current"] as const,
  job: (fittingJobId: number) => ["fitting", "job", fittingJobId] as const,
  tempResult: (fittingJobId: number) =>
    ["fitting", "job", fittingJobId, "result"] as const,
  resultRoot: ["fitting", "results"] as const,
  resultList: ["fitting", "results", "list"] as const,
  resultDetail: (fittingResultId: number) =>
    ["fitting", "results", "detail", fittingResultId] as const,
};
