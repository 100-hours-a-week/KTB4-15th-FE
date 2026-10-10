import { Suspense } from "react";
import { AccountSection } from "@/features/profile";
import {
  MemberProfileSection,
  MemberProfileSkeleton,
} from "@/features/profile/ui/member-profile-section";
import { Header, HeaderTitle } from "@/shared/ui/header";
import styles from "./page.module.scss";

export default function MyPage() {
  return (
    <>
      <Header left={<HeaderTitle>마이</HeaderTitle>} />
      <main className={styles.main}>
        <Suspense fallback={<MemberProfileSkeleton />}>
          <MemberProfileSection />
        </Suspense>
        <AccountSection />
      </main>
    </>
  );
}
