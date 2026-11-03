import { redirect } from "next/navigation";
import { getCurrentFittingJobServer } from "@/features/fitting/api/fitting-job-server";
import { FittingFullBodyPhotoSection } from "@/features/fitting/ui/entry/fitting-full-body-photo-section";
import { FittingOutfitSection } from "@/features/fitting/ui/entry/fitting-outfit-section";
import { getMemberProfileServer } from "@/features/profile/api/member-profile-server";
import {
  isServerUnauthorizedError,
  redirectOnServerUnauthorized,
} from "@/shared/api/server";
import { Header, HeaderTitle, NotificationLink } from "@/shared/ui/header";
import styles from "./page.module.scss";

export default async function FittingPage() {
  // Handle profile rejection immediately, even when redirecting before it finishes.
  const profileResultsPromise = Promise.allSettled([getMemberProfileServer()]);
  const fittingJob = await getCurrentFittingJobServer().catch(
    redirectOnServerUnauthorized,
  );

  if (fittingJob && !fittingJob.resultViewed) {
    redirect(`/fitting/jobs/${fittingJob.fittingJobId}`);
  }

  const [profileResult] = await profileResultsPromise;
  if (
    profileResult.status === "rejected" &&
    isServerUnauthorizedError(profileResult.reason)
  ) {
    return redirectOnServerUnauthorized(profileResult.reason);
  }
  const initialProfile =
    profileResult.status === "fulfilled" ? profileResult.value : undefined;

  return (
    <>
      <Header
        left={<HeaderTitle>피팅</HeaderTitle>}
        right={<NotificationLink />}
      />
      <main className={styles.main}>
        <FittingFullBodyPhotoSection initialProfile={initialProfile} />
        <FittingOutfitSection />
      </main>
    </>
  );
}
