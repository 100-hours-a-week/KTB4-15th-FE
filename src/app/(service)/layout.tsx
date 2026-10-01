import { ServiceAccessGuard } from "@/features/auth";

export default function ServiceLayout({ children }: LayoutProps<"/">) {
  return <ServiceAccessGuard>{children}</ServiceAccessGuard>;
}
