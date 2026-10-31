import { cookies } from "next/headers";
import { AuthenticatedUserRedirect } from "@/features/auth";

export default async function AuthLayout({ children }: LayoutProps<"/">) {
  const hasAccessToken = (await cookies()).has("accessToken");

  if (!hasAccessToken) return children;

  return <AuthenticatedUserRedirect>{children}</AuthenticatedUserRedirect>;
}
