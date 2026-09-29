import { PublicAccessGuard } from "@/features/auth";
import { PageShell } from "@/shared/ui/page-shell";

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <PageShell surface="surface">
      <PublicAccessGuard>{children}</PublicAccessGuard>
    </PageShell>
  );
}
