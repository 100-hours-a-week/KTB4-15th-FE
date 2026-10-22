import { notFound } from "next/navigation";
import { FittingResultDetailScreen } from "@/features/fitting";
import { Header, HeaderIconLink, HeaderTitle } from "@/shared/ui/header";
import { BackIcon } from "@/shared/ui/icon";

export default async function FittingResultDetailPage({
  params,
}: PageProps<"/fitting-results/[fittingResultId]">) {
  const { fittingResultId } = await params;
  const parsedFittingResultId = Number(fittingResultId);

  if (!Number.isInteger(parsedFittingResultId) || parsedFittingResultId <= 0) {
    notFound();
  }

  return (
    <>
      <Header
        center={<HeaderTitle>가상 피팅 결과</HeaderTitle>}
        left={
          <HeaderIconLink
            aria-label="저장 목록으로 돌아가기"
            href="/fitting-results"
          >
            <BackIcon />
          </HeaderIconLink>
        }
      />
      <FittingResultDetailScreen fittingResultId={parsedFittingResultId} />
    </>
  );
}
