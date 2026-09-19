import Link from "next/link";
import { useState, type ComponentType } from "react";
import styles from "./navigation-item.module.scss";

type NavigationIconProps = { className?: string };

type NavigationItemProps = {
  label: string;
  href: string;
  icon: ComponentType<NavigationIconProps>;
  activeIcon: ComponentType<NavigationIconProps>;
  active: boolean;
  featured?: boolean;
};

export function NavigationItem({
  label,
  href,
  icon,
  activeIcon,
  active,
  featured = false,
}: NavigationItemProps) {
  const Icon = active ? activeIcon : icon;
  const [pressed, setPressed] = useState(false);
  const classNames = [
    styles.item,
    active && styles.active,
    featured && styles.featured,
    pressed && styles.pressed,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={classNames}
      href={href}
      onAnimationEnd={() => setPressed(false)}
      onPointerDown={() => setPressed(true)}
    >
      <span aria-hidden="true" className={styles.icon}>
        <Icon />
      </span>
      <span className={styles.label}>{label}</span>
    </Link>
  );
}
