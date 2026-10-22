import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getMemberMeServer } from "@/features/member/api/member-server";
import { ONBOARDING_COOKIE_NAME } from "@/features/onboarding/model/onboarding-cookie";
import { redirectOnServerUnauthorized } from "@/shared/api/server";

export default async function Home() {
  const cookieStore = await cookies();
  const onboardingCompleted =
    cookieStore.get(ONBOARDING_COOKIE_NAME)?.value === "true";

  if (!onboardingCompleted) redirect("/onboarding");

  const member = await getMemberMeServer().catch(redirectOnServerUnauthorized);

  redirect(member.profileCompleted ? "/chat" : "/profile/setup");
}
