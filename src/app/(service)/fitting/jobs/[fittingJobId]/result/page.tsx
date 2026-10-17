import { notFound } from "next/navigation";
import { FittingTempResultScreen } from "@/features/fitting";
import { Header, HeaderIconLink, HeaderTitle } from "@/shared/ui/header";
import { BackIcon } from "@/shared/ui/icon";

export default async function FittingTempResultPage({
  params,
  searchParams,
}: PageProps<"/fitting/jobs/[fittingJobId]/result">) {
  const { fittingJobId } = await params;
  const { from } = await searchParams;
  const parsedFittingJobId = Number(fittingJobId);

  if (!Number.isInteger(parsedFittingJobId) || parsedFittingJobId <= 0) {
    notFound();
  }

  const backHref = from === "notifications" ? "/notifications" : "/fitting";
  const backLabel =
    from === "notifications" ? "알림으로 돌아가기" : "피팅으로 돌아가기";

  return (
    <>
      <Header
        center={<HeaderTitle>가상 피팅 결과</HeaderTitle>}
        left={
          <HeaderIconLink aria-label={backLabel} href={backHref}>
            <BackIcon />
          </HeaderIconLink>
        }
      />
      <FittingTempResultScreen fittingJobId={parsedFittingJobId} />
    </>
  );
}
