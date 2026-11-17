import { NotificationScreen } from "@/features/notification/ui/notification-screen";
import { BackButton } from "@/shared/ui/header/header-actions";
import { Header } from "@/shared/ui/header/header";
import { HeaderTitle } from "@/shared/ui/header/header-title";
import styles from "../page-layout.module.scss";

export const metadata = {
  title: "알림 | LOOK DDAK",
};

export default function NotificationsPage() {
  return (
    <>
      <Header left={<BackButton />} center={<HeaderTitle>알림</HeaderTitle>} />
      <main className={styles.main}>
        <NotificationScreen />
      </main>
    </>
  );
}
