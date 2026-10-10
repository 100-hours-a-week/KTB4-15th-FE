import { getMemberProfileServer } from "../api/member-profile-server";
import styles from "./member-profile-section.module.scss";

function formatMeasurement(value: number) {
  return new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 1,
  }).format(value);
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
  const profile = await getMemberProfileServer();

  return (
    <section aria-labelledby="profile-title" className={styles.card}>
      <p className={styles.eyebrow}>MY PROFILE</p>
      <h2 className={styles.name} id="profile-title">
        {profile.name}님의 기본 정보
      </h2>
      <p className={styles.email}>{profile.email}</p>
      <dl className={styles.measurements}>
        <div className={styles.measurement}>
          <dt>키</dt>
          <dd>
            {formatMeasurement(profile.height)}
            <span className={styles.unit}>cm</span>
          </dd>
        </div>
        <div className={styles.measurement}>
          <dt>몸무게</dt>
          <dd>
            {formatMeasurement(profile.weight)}
            <span className={styles.unit}>kg</span>
          </dd>
        </div>
        <div className={styles.measurement}>
          <dt>나이</dt>
          <dd>
            {profile.age}
            <span className={styles.unit}>세</span>
          </dd>
        </div>
      </dl>
    </section>
  );
}
