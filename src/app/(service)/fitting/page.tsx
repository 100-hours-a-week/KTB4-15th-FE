import {
  FittingEntryRedirect,
  FittingFullBodyPhotoSection,
  FittingOutfitSection,
} from "@/features/fitting";
import { Header, HeaderTitle, NotificationLink } from "@/shared/ui/header";
import styles from "./page.module.scss";

export default function FittingPage() {
  return (
    <FittingEntryRedirect>
      <Header
        left={<HeaderTitle>피팅</HeaderTitle>}
        right={<NotificationLink />}
      />
      <main className={styles.main}>
        <FittingFullBodyPhotoSection />
        <FittingOutfitSection />
      </main>
    </FittingEntryRedirect>
  );
}
