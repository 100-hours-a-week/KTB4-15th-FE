"use client";

import Image from "next/image";
import { useMemberProfileQuery } from "@/features/profile/api/member-profile-query";
import styles from "./fitting-photo-card.module.scss";

export function FittingPhotoCard() {
  const { data: memberProfile, isPending } = useMemberProfileQuery();

  const bodyProfileText = isPending
    ? "체형 정보 불러오는 중"
    : memberProfile
      ? `${memberProfile.height}cm · ${memberProfile.weight}kg`
      : "체형 정보를 확인해 주세요";

  return (
    <section aria-label="내 전신 사진" className={styles.card}>
      <Image
        alt="가상 피팅에 사용할 등록된 전신 사진"
        className={styles.image}
        fill
        priority
        sizes="(max-width: 480px) calc(100vw - 40px), 440px"
        src="/images/profile/full-body-example.png"
      />
      <div className={styles.meta}>
        <span className={styles.profileBadge}>
          <span className={styles.statusDot} />
          등록된 기본 체형 ({bodyProfileText})
        </span>
      </div>
    </section>
  );
}
