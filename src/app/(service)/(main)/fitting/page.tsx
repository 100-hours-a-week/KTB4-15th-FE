import {
  FittingEntryGuard,
  FittingPhotoCard,
  FittingSelectionPanel,
} from "@/features/fitting";
import { Header, HeaderTitle } from "@/shared/ui/header";
import { IntroHero } from "@/shared/ui/intro-hero";
import styles from "./page.module.scss";

export default function FittingPage() {
  return (
    <>
      <FittingEntryGuard />
      <Header left={<HeaderTitle>피팅</HeaderTitle>} />
      <main className={styles.main}>
        <IntroHero
          description="상의와 하의를 골라 가상으로 피팅해 보세요"
          title={"내 사진 위에\n마음에 드는 옷 입혀보기"}
        />
        <FittingPhotoCard />
        <FittingSelectionPanel />
      </main>
    </>
  );
}
