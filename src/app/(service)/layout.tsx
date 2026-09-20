import { NavigationBar } from "@/shared/ui/navigation";
import { PageShell } from "@/shared/ui/page-shell";

export default function ServiceLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <PageShell surface="page">{children}</PageShell>
      <NavigationBar />
    </>
  );
}
