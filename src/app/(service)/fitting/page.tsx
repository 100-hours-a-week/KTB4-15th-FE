import { redirect } from "next/navigation";
import { getCurrentFittingJobServer } from "@/features/fitting/api/fitting-job-server";
import {
  FittingFullBodyPhotoSection,
  FittingOutfitSection,
} from "@/features/fitting";
import { redirectOnServerUnauthorized } from "@/shared/api/server";
import { Header, HeaderTitle, NotificationLink } from "@/shared/ui/header";
import styles from "./page.module.scss";

export default async function FittingPage() {
  const fittingJob = await getCurrentFittingJobServer().catch(
    redirectOnServerUnauthorized,
  );

  if (fittingJob && !fittingJob.resultViewed) {
    redirect(`/fitting/jobs/${fittingJob.fittingJobId}`);
  }

  return (
    <>
      <Header
        left={<HeaderTitle>피팅</HeaderTitle>}
        right={<NotificationLink />}
      />
      <main className={styles.main}>
        <FittingFullBodyPhotoSection />
        <FittingOutfitSection />
      </main>
    </>
  );
}
