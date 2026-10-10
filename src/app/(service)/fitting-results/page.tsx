import { FittingResultListScreen } from "@/features/fitting";
import { Header, HeaderIconLink, HeaderTitle } from "@/shared/ui/header";
import { BackIcon } from "@/shared/ui/icon";

export default function FittingResultsPage() {
  return (
    <>
      <Header
        center={<HeaderTitle>가상 피팅 저장 목록</HeaderTitle>}
        left={
          <HeaderIconLink aria-label="마이페이지로 돌아가기" href="/mypage">
            <BackIcon />
          </HeaderIconLink>
        }
      />
      <FittingResultListScreen />
    </>
  );
}
