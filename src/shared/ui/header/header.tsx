import type { ComponentProps, ReactNode } from "react";
import styles from "./header.module.scss";

export type HeaderProps = Omit<ComponentProps<"header">, "children"> & {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
};

export function Header({
  left,
  center,
  right,
  className,
  ...props
}: HeaderProps) {
  const hasCenter = center != null;
  const classNames = [
    styles.header,
    hasCenter ? styles.centered : styles.sides,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header {...props} className={classNames}>
      <div className={styles.left}>{left}</div>
      {hasCenter && <div className={styles.center}>{center}</div>}
      <div className={styles.right}>{right}</div>
    </header>
  );
}
