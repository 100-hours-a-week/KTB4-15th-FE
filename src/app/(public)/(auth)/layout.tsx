import { AuthenticatedUserRedirect } from "@/features/auth";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return <AuthenticatedUserRedirect>{children}</AuthenticatedUserRedirect>;
}
