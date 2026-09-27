import {
  NavigationBar,
  TabPageTransition,
  NavigationVisibilityProvider,
} from "@/shared/ui/navigation";
import { PageShell } from "@/shared/ui/page-shell";

export default function MainLayout({ children }: LayoutProps<"/">) {
  return (
    <NavigationVisibilityProvider>
      <TabPageTransition>
        <PageShell surface="page">{children}</PageShell>
      </TabPageTransition>
      <NavigationBar />
    </NavigationVisibilityProvider>
  );
}
