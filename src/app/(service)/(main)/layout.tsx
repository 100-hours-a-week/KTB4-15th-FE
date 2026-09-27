import {
  NavigationBar,
  NavigationVisibilityProvider,
} from "@/shared/ui/navigation";
import { PageShell } from "@/shared/ui/page-shell";

export default function MainLayout({ children }: LayoutProps<"/">) {
  return (
    <NavigationVisibilityProvider>
      <PageShell surface="page">{children}</PageShell>
      <NavigationBar />
    </NavigationVisibilityProvider>
  );
}
