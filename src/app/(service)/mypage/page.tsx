import { Suspense } from "react";
import { FittingResultSection } from "@/features/fitting/ui/result/fitting-result-section";
import { AccountDeletion } from "@/features/profile/ui/account-deletion";
import { AccountSection } from "@/features/profile/ui/account-section";
import {
  MemberProfileSection,
  MemberProfileSkeleton,
} from "@/features/profile/ui/member-profile-section";
import { Header } from "@/shared/ui/header/header";
import { HeaderTitle } from "@/shared/ui/header/header-title";
import { NotificationLink } from "@/shared/ui/header/header-actions";
import styles from "../page-layout.module.scss";

export const metadata = {
  title: "마이페이지 | LOOK DDAK",
};

export default function MyPage() {
  return (
    <>
      <Header
        left={<HeaderTitle>마이</HeaderTitle>}
        right={<NotificationLink />}
      />
      <main className={styles.main}>
        <Suspense fallback={<MemberProfileSkeleton />}>
          <MemberProfileSection />
        </Suspense>
        <FittingResultSection />
        <AccountSection />
        <AccountDeletion />
      </main>
    </>
  );
}
