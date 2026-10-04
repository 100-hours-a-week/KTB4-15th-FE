import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ONBOARDING_COOKIE_NAME = "look-ddak-onboarding-completed";

export default async function Home() {
  const cookieStore = await cookies();
  const onboardingCompleted =
    cookieStore.get(ONBOARDING_COOKIE_NAME)?.value === "true";

  redirect(onboardingCompleted ? "/login" : "/onboarding");
}
