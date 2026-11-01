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
  const fittingJob = await getCurrentFittingJobServer().catch(
    redirectOnServerUnauthorized,
  );

  if (fittingJob && !fittingJob.resultViewed) {
    redirect(`/fitting/jobs/${fittingJob.fittingJobId}`);
  }

  const initialProfile = await getMemberProfileServer().catch(
    (error: unknown) => {
      if (isServerUnauthorizedError(error)) {
        return redirectOnServerUnauthorized(error);
      }
    },
  );

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
