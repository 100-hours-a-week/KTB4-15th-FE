import type { ReactNode } from "react";
import { ButtonBase, type ButtonBaseProps } from "./button-base";
import styles from "./button.module.scss";

type ButtonVariant = "primary" | "secondary" | "outlined" | "text" | "danger";
type ButtonSize = "small" | "medium" | "large";

export type ButtonProps = ButtonBaseProps & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
  isLoading?: boolean;
};

export function Button({
  children,
  className,
  disabled,
  fullWidth = false,
  isLoading = false,
  leadingIcon,
  trailingIcon,
  type = "button",
  variant = "primary",
  size = "medium",
  ...props
}: ButtonProps) {
  const classNames = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    isLoading && styles.loading,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <ButtonBase
      {...props}
      aria-busy={isLoading || undefined}
      className={classNames}
      disabled={disabled || isLoading}
      type={type}
    >
      <span className={styles.content}>
        {leadingIcon && (
          <span aria-hidden="true" className={styles.icon}>
            {leadingIcon}
          </span>
        )}
        <span>{children}</span>
        {trailingIcon && (
          <span aria-hidden="true" className={styles.icon}>
            {trailingIcon}
          </span>
        )}
      </span>
      {isLoading && <span aria-hidden="true" className={styles.spinner} />}
    </ButtonBase>
  );
}
