import { NotificationScreen } from "@/features/notification";
import { Header, HeaderTitle } from "@/shared/ui/header";
import styles from "./page.module.scss";

export default function NotificationsPage() {
  return (
    <>
      <Header left={<HeaderTitle>알림</HeaderTitle>} />
      <main className={styles.main}>
        <NotificationScreen />
      </main>
    </>
  );
}
