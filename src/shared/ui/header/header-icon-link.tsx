import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import baseStyles from "../button/button-base.module.scss";
import iconStyles from "../button/icon-button.module.scss";
import styles from "./header-icon-button.module.scss";

export type HeaderIconLinkProps = Omit<
  ComponentProps<typeof Link>,
  "aria-label" | "children"
> & {
  "aria-label": string;
  children: ReactNode;
};

export function HeaderIconLink({
  children,
  className,
  ...props
}: HeaderIconLinkProps) {
  const classNames = [
    baseStyles.button,
    iconStyles.button,
    iconStyles.large,
    iconStyles.standard,
    styles.control,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Link {...props} className={classNames}>
      <span aria-hidden="true" className={iconStyles.icon}>
        {children}
      </span>
    </Link>
  );
}
