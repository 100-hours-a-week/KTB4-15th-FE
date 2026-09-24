import type { ComponentProps } from "react";
import styles from "./header-title.module.scss";

export type HeaderTitleProps = ComponentProps<"h1">;

export function HeaderTitle({ className, ...props }: HeaderTitleProps) {
  const classNames = [styles.title, className].filter(Boolean).join(" ");

  return <h1 {...props} className={classNames} data-header-title />;
}
