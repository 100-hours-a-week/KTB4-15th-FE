"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import type { ReactNode } from "react";
import styles from "./dropdown.module.scss";

export type DropdownProps = {
  children: ReactNode;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  trigger: ReactNode;
};

export function Dropdown({
  children,
  onOpenChange,
  open,
  trigger,
}: DropdownProps) {
  return (
    <DropdownMenu.Root onOpenChange={onOpenChange} open={open}>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          className={styles.content}
          collisionPadding={12}
          sideOffset={4}
        >
          {children}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export type DropdownItemProps = {
  children: ReactNode;
  destructive?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  onSelect?: () => void;
};

export function DropdownItem({
  children,
  destructive = false,
  disabled = false,
  icon,
  onSelect,
}: DropdownItemProps) {
  const classNames = [styles.item, destructive && styles.destructive]
    .filter(Boolean)
    .join(" ");

  return (
    <DropdownMenu.Item
      className={classNames}
      disabled={disabled}
      onSelect={onSelect}
    >
      {icon && (
        <span aria-hidden="true" className={styles.icon}>
          {icon}
        </span>
      )}
      <span className={styles.label}>{children}</span>
    </DropdownMenu.Item>
  );
}
