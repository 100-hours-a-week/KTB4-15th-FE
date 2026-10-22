import { ServiceAccessGuard } from "@/features/auth";
import { getMemberMeServer } from "@/features/member/api/member-server";
import { redirectOnServerUnauthorized } from "@/shared/api/server";
import { ServiceShell } from "./service-shell";

export default async function ServiceLayout({ children }: LayoutProps<"/">) {
  const initialMember = await getMemberMeServer().catch(
    redirectOnServerUnauthorized,
  );

  return (
    <ServiceAccessGuard initialMember={initialMember}>
      <ServiceShell>{children}</ServiceShell>
    </ServiceAccessGuard>
  );
}
