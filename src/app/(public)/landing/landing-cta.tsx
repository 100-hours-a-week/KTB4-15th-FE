import Link from "next/link";
import { LandingStartButton } from "./landing-start-button";
import styles from "./landing-cta.module.scss";

export function LandingCta() {
  return (
    <section className={styles.cta}>
      <h2>
        찾는 것부터 입어보는 것까지,
        <br />
        이제 <em>나에게 룩딱.</em>
      </h2>
      <p className={styles.ctaDescription}>
        취향을 말하고, 마음에 드는 옷을 내 모습으로 만나보세요.
      </p>
      <LandingStartButton className={styles.startLink} />
      <p className={styles.loginPrompt}>
        이미 계정이 있나요? <Link href="/login">로그인</Link>
      </p>
    </section>
  );
}
