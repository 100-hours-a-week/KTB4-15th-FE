import { redirect } from "next/navigation";
import { getCurrentFittingJobServer } from "@/features/fitting/api/fitting-job-server";
import { FittingFullBodyPhotoSection } from "@/features/fitting/ui/entry/fitting-full-body-photo-section";
import { FittingOutfitSection } from "@/features/fitting/ui/entry/fitting-outfit-section";
import { redirectOnServerUnauthorized } from "@/shared/api/server";
import { Header } from "@/shared/ui/header/header";
import { HeaderTitle } from "@/shared/ui/header/header-title";
import { NotificationLink } from "@/shared/ui/header/header-actions";
import styles from "./page.module.scss";

export const metadata = {
  title: "가상 피팅 | LOOK DDAK",
};

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
