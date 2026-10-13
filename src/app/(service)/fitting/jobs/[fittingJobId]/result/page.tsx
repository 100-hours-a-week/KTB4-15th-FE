import { notFound } from "next/navigation";
import { FittingTempResultScreen } from "@/features/fitting";
import { Header, HeaderIconLink, HeaderTitle } from "@/shared/ui/header";
import { BackIcon } from "@/shared/ui/icon";

export default async function FittingTempResultPage({
  params,
}: PageProps<"/fitting/jobs/[fittingJobId]/result">) {
  const { fittingJobId } = await params;
  const parsedFittingJobId = Number(fittingJobId);

  if (!Number.isInteger(parsedFittingJobId) || parsedFittingJobId <= 0) {
    notFound();
  }

  return (
    <>
      <Header
        center={<HeaderTitle>가상 피팅 결과</HeaderTitle>}
        left={
          <HeaderIconLink aria-label="피팅으로 돌아가기" href="/fitting">
            <BackIcon />
          </HeaderIconLink>
        }
      />
      <FittingTempResultScreen fittingJobId={parsedFittingJobId} />
    </>
  );
}
