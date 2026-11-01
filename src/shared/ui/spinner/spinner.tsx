import styles from "./spinner.module.scss";

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`${styles.spinner} ${className ?? ""}`}
    />
  );
}
