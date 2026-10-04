import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { OnboardingScreen } from "@/features/onboarding";

const ONBOARDING_COOKIE_NAME = "look-ddak-onboarding-completed";

export default async function OnboardingPage() {
  const cookieStore = await cookies();

  if (cookieStore.get(ONBOARDING_COOKIE_NAME)?.value === "true") {
    redirect("/login");
  }

  return <OnboardingScreen />;
}
