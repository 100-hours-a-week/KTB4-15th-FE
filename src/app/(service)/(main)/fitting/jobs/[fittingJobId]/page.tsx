import { FittingJobScreen } from "@/features/fitting";

export default async function FittingJobPage({
  params,
}: PageProps<"/fitting/jobs/[fittingJobId]">) {
  const { fittingJobId } = await params;
  const parsedFittingJobId = Number(fittingJobId);

  return <FittingJobScreen fittingJobId={parsedFittingJobId} />;
}
