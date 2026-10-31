import styles from "./landing-footer.module.scss";

export function LandingFooter() {
  return (
    <footer className={styles.footer}>
      <span className={styles.footerLogo}>LOOK DDAK</span>
      <a className={styles.contactLink} href="mailto:ktb4.15th@gmail.com">
        문의 · ktb4.15th@gmail.com
      </a>
      <p>사진 속 인물과 착장은 AI로 제작한 서비스 연출 예시입니다.</p>
    </footer>
  );
}
