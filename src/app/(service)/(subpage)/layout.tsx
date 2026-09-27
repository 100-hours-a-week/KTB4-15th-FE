import { PageShell } from "@/shared/ui/page-shell";

export default function SubpageLayout({ children }: LayoutProps<"/">) {
  return <PageShell surface="page">{children}</PageShell>;
}
