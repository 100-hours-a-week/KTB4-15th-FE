import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { OnboardingScreen } from "@/features/onboarding";
import { ONBOARDING_COOKIE_NAME } from "@/features/onboarding/model/onboarding-cookie";

export default async function OnboardingPage() {
  const cookieStore = await cookies();

  if (cookieStore.get(ONBOARDING_COOKIE_NAME)?.value === "true") {
    redirect("/login");
  }

  return <OnboardingScreen />;
}
