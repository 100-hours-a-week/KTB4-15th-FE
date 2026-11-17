import { notFound } from "next/navigation";
import { FittingResultDetailScreen } from "@/features/fitting/ui/result/fitting-result-detail-screen";
import { Header } from "@/shared/ui/header/header";
import { HeaderIconLink } from "@/shared/ui/header/header-icon-link";
import { HeaderTitle } from "@/shared/ui/header/header-title";
import { BackIcon } from "@/shared/ui/icon/interface-icons";

export async function generateMetadata({
  params,
}: PageProps<"/fitting-results/[fittingResultId]">) {
  const id = Number((await params).fittingResultId);
  const title =
    Number.isInteger(id) && id > 0
      ? "저장한 가상 피팅 상세"
      : "페이지를 찾을 수 없음";
  return { title: `${title} | LOOK DDAK` };
}

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
