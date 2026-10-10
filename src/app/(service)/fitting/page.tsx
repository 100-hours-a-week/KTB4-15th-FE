import {
  FittingEntryGuard,
  FittingPhotoCard,
  FittingSelectionPanel,
} from "@/features/fitting";
import { Header, HeaderTitle } from "@/shared/ui/header";
import styles from "./page.module.scss";

export default function FittingPage() {
  return (
    <FittingEntryGuard>
      <Header left={<HeaderTitle>피팅</HeaderTitle>} />
      <main className={styles.main}>
        <FittingPhotoCard />
        <FittingSelectionPanel />
      </main>
    </FittingEntryGuard>
  );
}
