import { redirectOnServerUnauthorized } from "@/shared/api/server";
import { getMemberProfileServer } from "../api/member-profile-server";
import styles from "./member-profile-section.module.scss";

function formatMeasurement(value: number) {
  return new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 1,
  }).format(value);
}

function MeasurementValue({
  unit,
  value,
}: {
  unit: string;
  value: number | null;
}) {
  if (value === null) {
    return (
      <dd aria-label="미등록" className={styles.emptyValue}>
        -
      </dd>
    );
  }

  return (
    <dd>
      {formatMeasurement(value)}
      <span className={styles.unit}>{unit}</span>
    </dd>
  );
}

export function MemberProfileSkeleton() {
  return (
    <div
      aria-label="프로필을 불러오는 중"
      className={styles.skeleton}
      role="status"
    />
  );
}

export async function MemberProfileSection() {
  const profile = await getMemberProfileServer().catch(
    redirectOnServerUnauthorized,
  );

  return (
    <section aria-labelledby="profile-title" className={styles.card}>
      <p className={styles.eyebrow}>내 정보</p>
      <h2 className={styles.name} id="profile-title">
        {profile.name}님의 기본 정보
      </h2>
      <p className={styles.email}>{profile.email}</p>
      <dl className={styles.measurements}>
        <div className={styles.measurement}>
          <dt>키</dt>
          <MeasurementValue unit="cm" value={profile.height} />
        </div>
        <div className={styles.measurement}>
          <dt>몸무게</dt>
          <MeasurementValue unit="kg" value={profile.weight} />
        </div>
        <div className={styles.measurement}>
          <dt>나이</dt>
          <MeasurementValue unit="세" value={profile.age} />
        </div>
      </dl>
    </section>
  );
}
