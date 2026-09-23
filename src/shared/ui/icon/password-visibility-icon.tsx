import { EyeIcon, EyeOffIcon } from "./eye";
import styles from "./password-visibility-icon.module.scss";

export type PasswordVisibilityIconProps = {
  isVisible: boolean;
};

export function PasswordVisibilityIcon({
  isVisible,
}: PasswordVisibilityIconProps) {
  return (
    <span className={styles.icon}>
      {isVisible ? <EyeOffIcon /> : <EyeIcon />}
    </span>
  );
}
