import styles from "./spinner.module.scss";

export function Spinner({ label }: { label: string }) {
  return <span aria-label={label} className={styles.spinner} role="status" />;
}
