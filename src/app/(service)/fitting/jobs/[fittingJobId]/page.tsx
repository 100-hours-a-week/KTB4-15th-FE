import { FittingJobScreen } from "@/features/fitting/ui/job/fitting-job-screen";

export const metadata = {
  title: "가상 피팅 진행 | LOOK DDAK",
};

export default async function FittingJobPage({
  params,
}: PageProps<"/fitting/jobs/[fittingJobId]">) {
  const { fittingJobId } = await params;
  const parsedFittingJobId = Number(fittingJobId);

  return <FittingJobScreen fittingJobId={parsedFittingJobId} />;
}
