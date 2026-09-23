import { PageShell } from "@/shared/ui/page-shell";

export default function StandaloneLayout({ children }: LayoutProps<"/">) {
  return <PageShell surface="surface">{children}</PageShell>;
}
