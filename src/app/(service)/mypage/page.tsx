import { Suspense } from "react";
import { FittingResultSection } from "@/features/fitting";
import { AccountDeletion, AccountSection } from "@/features/profile";
import {
  MemberProfileSection,
  MemberProfileSkeleton,
} from "@/features/profile/ui/member-profile-section";
import { Header, HeaderTitle, NotificationLink } from "@/shared/ui/header";
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
