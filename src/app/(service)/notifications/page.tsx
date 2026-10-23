import { NotificationScreen } from "@/features/notification";
import { BackButton, Header, HeaderTitle } from "@/shared/ui/header";
import styles from "../page-layout.module.scss";

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
