import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ONBOARDING_COOKIE_NAME } from "@/features/onboarding/model/onboarding-cookie";

export default async function Home() {
  const cookieStore = await cookies();
  const onboardingCompleted =
    cookieStore.get(ONBOARDING_COOKIE_NAME)?.value === "true";

  redirect(onboardingCompleted ? "/login" : "/onboarding");
}
