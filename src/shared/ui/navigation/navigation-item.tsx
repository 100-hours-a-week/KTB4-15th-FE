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
  available?: boolean;
  featured?: boolean;
};

export function NavigationItem({
  label,
  href,
  icon,
  activeIcon,
  active,
  available = true,
  featured = false,
}: NavigationItemProps) {
  const Icon = active ? activeIcon : icon;
  const [pressed, setPressed] = useState(false);
  const classNames = [
    styles.item,
    active && styles.active,
    !available && styles.unavailable,
    featured && styles.featured,
    pressed && styles.pressed,
  ]
    .filter(Boolean)
    .join(" ");
  const content = (
    <>
      <span aria-hidden="true" className={styles.iconSlot}>
        <span className={styles.icon}>
          <Icon />
        </span>
        {!available && <span className={styles.comingSoon}>SOON</span>}
      </span>
      <span className={styles.label}>{label}</span>
    </>
  );

  if (!available) {
    return (
      <button
        aria-label={`${label}, 곧 오픈 예정`}
        className={classNames}
        disabled
        type="button"
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={classNames}
      href={href}
      onAnimationEnd={() => setPressed(false)}
      onPointerDown={() => setPressed(true)}
    >
      {content}
    </Link>
  );
}
