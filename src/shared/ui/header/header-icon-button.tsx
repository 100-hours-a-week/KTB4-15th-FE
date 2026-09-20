import { IconButton, type IconButtonProps } from "@/shared/ui/button";
import styles from "./header-icon-button.module.scss";

export type HeaderIconButtonProps = Omit<IconButtonProps, "size" | "variant">;

export function HeaderIconButton({
  className,
  ...props
}: HeaderIconButtonProps) {
  const classNames = [styles.control, className].filter(Boolean).join(" ");

  return (
    <IconButton
      {...props}
      className={classNames}
      size="large"
      variant="standard"
    />
  );
}
