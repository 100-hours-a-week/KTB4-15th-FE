import { FittingResultListScreen } from "@/features/fitting/ui/result/fitting-result-list-screen";
import { Header } from "@/shared/ui/header/header";
import { HeaderIconLink } from "@/shared/ui/header/header-icon-link";
import { HeaderTitle } from "@/shared/ui/header/header-title";
import { BackIcon } from "@/shared/ui/icon/interface-icons";

export const metadata = {
  title: "저장한 가상 피팅 | LOOK DDAK",
};

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
