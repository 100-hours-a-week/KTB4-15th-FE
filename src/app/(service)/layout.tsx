import { NavigationBar } from "@/shared/ui/navigation";

export default function ServiceLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {children}
      <NavigationBar />
    </>
  );
}
