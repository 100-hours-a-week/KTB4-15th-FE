import { ServiceAccessGuard } from "@/features/auth";
import { getMemberMeServer } from "@/features/member/api/member-server";
import { getNotificationUnreadStatusServer } from "@/features/notification/api/notification-server";
import { redirectOnServerUnauthorized } from "@/shared/api/server";
import { ServiceShell } from "./service-shell";

export default async function ServiceLayout({ children }: LayoutProps<"/">) {
  const [initialMember, initialUnreadStatus] = await Promise.all([
    getMemberMeServer().catch(redirectOnServerUnauthorized),
    getNotificationUnreadStatusServer().catch(() => undefined),
  ]);

  return (
    <ServiceAccessGuard initialMember={initialMember}>
      <ServiceShell initialUnreadStatus={initialUnreadStatus}>
        {children}
      </ServiceShell>
    </ServiceAccessGuard>
  );
}
