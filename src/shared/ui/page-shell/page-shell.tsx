import type { HTMLAttributes, ReactNode } from "react";
import styles from "./page-shell.module.scss";

type PageShellSurface = "page" | "surface";

export type PageShellProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  children: ReactNode;
  surface?: PageShellSurface;
};

export function PageShell({
  children,
  className,
  surface = "page",
  ...props
}: PageShellProps) {
  const classNames = [styles.shell, styles[surface], className]
    .filter(Boolean)
    .join(" ");

  return (
    <div {...props} className={classNames}>
      {children}
    </div>
  );
}