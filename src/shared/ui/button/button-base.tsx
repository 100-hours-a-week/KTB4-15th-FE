import type { ComponentProps } from "react";
import styles from "./button-base.module.scss";

export type ButtonBaseProps = ComponentProps<"button">;

export function ButtonBase({
  className,
  type = "button",
  ...props
}: ButtonBaseProps) {
  const classNames = [styles.button, className].filter(Boolean).join(" ");

  return <button {...props} className={classNames} type={type} />;
}
