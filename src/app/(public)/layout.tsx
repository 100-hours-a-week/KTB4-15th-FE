import { PageShell } from "@/shared/ui/page-shell";

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return <PageShell surface="surface">{children}</PageShell>;
}
