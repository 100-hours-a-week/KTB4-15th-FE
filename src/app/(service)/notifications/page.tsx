import { NotificationListScreen } from "@/features/notification";
import { Header, HeaderTitle } from "@/shared/ui/header";

export default function NotificationsPage() {
  return (
    <>
      <Header left={<HeaderTitle>알림</HeaderTitle>} />
      <NotificationListScreen />
    </>
  );
}
