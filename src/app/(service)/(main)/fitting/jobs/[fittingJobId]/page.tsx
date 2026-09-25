import { FittingJobScreen } from "@/features/fitting";
import { Header, HeaderIconLink, HeaderTitle } from "@/shared/ui/header";
import { BackIcon } from "@/shared/ui/icon";

export default async function FittingJobPage({
  params,
}: PageProps<"/fitting/jobs/[fittingJobId]">) {
  const { fittingJobId } = await params;
  const parsedFittingJobId = Number(fittingJobId);

  return (
    <>
      <Header
        center={<HeaderTitle>가상 피팅</HeaderTitle>}
        left={
          <HeaderIconLink aria-label="피팅으로 돌아가기" href="/fitting">
            <BackIcon />
          </HeaderIconLink>
        }
      />
      <FittingJobScreen fittingJobId={parsedFittingJobId} />
    </>
  );
}
