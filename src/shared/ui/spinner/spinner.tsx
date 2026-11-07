import styles from "./spinner.module.scss";

export function Spinner({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={`${styles.spinner} ${className ?? ""}`}
      role={label ? "status" : undefined}
    />
  );
}
