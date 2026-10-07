import { ServiceAccessGuard } from "@/features/auth";
import { ServiceShell } from "./service-shell";

export default function ServiceLayout({ children }: LayoutProps<"/">) {
  return (
    <ServiceAccessGuard>
      <ServiceShell>{children}</ServiceShell>
    </ServiceAccessGuard>
  );
}
