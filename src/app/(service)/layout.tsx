import { ServiceAccessGuard } from "@/features/auth/ui/service-access-guard";

export default function ServiceLayout({ children }: LayoutProps<"/">) {
  return <ServiceAccessGuard>{children}</ServiceAccessGuard>;
}
