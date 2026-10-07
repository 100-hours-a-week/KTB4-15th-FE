import Image from "next/image";
import styles from "./profile-setup-form.module.scss";

export function ProfileSetupComplete() {
  return (
    <main aria-live="polite" className={styles.complete} role="status">
      <div aria-hidden="true" className={styles.completeIcon}>
        <Image
          alt=""
          height={88}
          loading="eager"
          src="/images/profile/success-check-3d.png"
          width={88}
        />
      </div>
      <h1>기본 정보 등록 완료!</h1>
      <p>
        이제 룩딱이 취향에 맞는
        <br />
        스타일을 추천해 드릴게요.
      </p>
      <small>잠시 후 AI 스타일리스트와의 채팅이 시작돼요.</small>
    </main>
  );
}
