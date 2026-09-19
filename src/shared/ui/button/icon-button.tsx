import type { ReactNode } from "react";
import { ButtonBase, type ButtonBaseProps } from "./button-base";
import styles from "./icon-button.module.scss";

type IconButtonVariant = "standard" | "outlined" | "primary" | "secondary";
type IconButtonSize = "small" | "medium" | "large";

export type IconButtonProps = Omit<
  ButtonBaseProps,
  "aria-label" | "children"
> & {
  "aria-label": string;
  children: ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
};

export function IconButton({
  children,
  className,
  size = "medium",
  variant = "standard",
  ...props
}: IconButtonProps) {
  const classNames = [styles.button, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(" ");
  return (
    <ButtonBase {...props} className={classNames}>
      <span aria-hidden="true" className={styles.icon}>
        {children}
      </span>
    </ButtonBase>
  );
}
