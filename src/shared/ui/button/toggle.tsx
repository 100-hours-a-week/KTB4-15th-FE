"use client";

import type { ComponentProps, MouseEvent } from "react";
import styles from "./toggle.module.scss";

export type ToggleProps = Omit<
  ComponentProps<"button">,
  "aria-checked" | "children" | "role"
> & {
  "aria-label": string;
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

export function Toggle({
  checked,
  className,
  onCheckedChange,
  onClick,
  type = "button",
  ...props
}: ToggleProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);

    if (!event.defaultPrevented) {
      onCheckedChange?.(!checked);
    }
  };

  const classNames = [styles.toggle, checked && styles.checked, className]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      {...props}
      aria-checked={checked}
      className={classNames}
      onClick={handleClick}
      role="switch"
      type={type}
    />
  );
}
