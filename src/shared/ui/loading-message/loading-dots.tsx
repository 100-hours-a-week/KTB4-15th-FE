import styles from "./loading-message.module.scss";

export function LoadingDots() {
  return (
    <span aria-hidden="true" className={styles.dots}>
      <span />
      <span />
      <span />
    </span>
  );
}
