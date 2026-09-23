import type { ReactNode } from "react";
import styles from "./intro-hero.module.scss";

export type IntroHeroProps = {
  title: ReactNode;
  description: ReactNode;
  className?: string;
  size?: "default" | "compact";
};

export function IntroHero({
  className,
  description,
  size = "default",
  title,
}: IntroHeroProps) {
  const classNames = [styles.hero, styles[size], className]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={classNames}>
      <h1>{title}</h1>
      <p>{description}</p>
    </section>
  );
}
