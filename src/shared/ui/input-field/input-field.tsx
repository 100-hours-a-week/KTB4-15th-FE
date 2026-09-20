import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import styles from "./input-field.module.scss";

export type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  helperText?: string;
  reserveHelperSpace?: boolean;
  showRequiredMark?: boolean;
  error?: string;
  suffix?: string;
  endAdornment?: ReactNode;
};

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  function InputField(
    {
      "aria-describedby": ariaDescribedby,
      className,
      error,
      helperText,
      id,
      label,
      required,
      reserveHelperSpace = true,
      showRequiredMark = true,
      suffix,
      endAdornment,
      ...props
    },
    ref,
  ) {
    const generatedId = useId();
    const inputId = id ?? `input-field-${generatedId}`;
    const message = error || helperText;
    const shouldRenderMessage = Boolean(message) || reserveHelperSpace;
    const messageId = `${inputId}-message`;
    const suffixId = `${inputId}-suffix`;
    const describedBy = [
      ariaDescribedby,
      message && messageId,
      suffix && suffixId,
    ]
      .filter(Boolean)
      .join(" ");
    const inputClassNames = [styles.input, error && styles.error, className]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={styles.field}>
        <label className={styles.label} htmlFor={inputId}>
          <span>{label}</span>
          {required && showRequiredMark && (
            <span aria-hidden="true" className={styles.requiredMark}>
              *
            </span>
          )}
        </label>
        <div className={styles.inputWrapper}>
          <input
            {...props}
            {...(describedBy ? { "aria-describedby": describedBy } : {})}
            aria-invalid={error ? true : undefined}
            className={inputClassNames}
            id={inputId}
            ref={ref}
            required={required}
          />
          {(suffix || endAdornment) && (
            <span className={styles.endAdornment}>
              {suffix && (
                <span className={styles.suffix} id={suffixId}>
                  {suffix}
                </span>
              )}
              {endAdornment}
            </span>
          )}
        </div>
        {shouldRenderMessage && (
          <p
            className={error ? styles.errorMessage : styles.helperText}
            id={messageId}
          >
            {message}
          </p>
        )}
      </div>
    );
  },
);

InputField.displayName = "InputField";
