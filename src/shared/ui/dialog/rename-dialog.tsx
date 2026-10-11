"use client";

import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/shared/ui/button";
import { ClearIcon } from "@/shared/ui/icon";
import { Dialog, DialogClose, DialogDescription, DialogTitle } from "./dialog";
import styles from "./rename-dialog.module.scss";

type RenameDialogProps = {
  description: string;
  initialValue: string;
  isLoading?: boolean;
  label: string;
  maxLength: number;
  onConfirm: (value: string) => void;
  onExit?: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
};

export function RenameDialog({
  description,
  initialValue,
  isLoading = false,
  label,
  maxLength,
  onConfirm,
  onExit,
  onOpenChange,
  open,
  title,
}: RenameDialogProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const trimmedValue = value.trim();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmedValue || trimmedValue === initialValue) return;

    onConfirm(trimmedValue);
  };

  return (
    <Dialog
      className={styles.dialog}
      onExit={onExit}
      onOpenAutoFocus={(event) => {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setValue(initialValue);
        onOpenChange(nextOpen);
      }}
      open={open}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle className={styles.title}>{title}</DialogTitle>
        <DialogDescription className={styles.description}>
          {description}
        </DialogDescription>

        <div className={styles.inputField}>
          <div className={styles.inputControl}>
            <label className={styles.visuallyHidden} htmlFor="rename-value">
              {label}
            </label>
            <input
              disabled={isLoading}
              id="rename-value"
              maxLength={maxLength}
              onChange={(event) => setValue(event.target.value)}
              ref={inputRef}
              value={value}
            />
            {value && !isLoading && (
              <button
                aria-label={`${label} 지우기`}
                className={styles.clearButton}
                onClick={() => {
                  setValue("");
                  inputRef.current?.focus();
                }}
                type="button"
              >
                <ClearIcon />
              </button>
            )}
          </div>
          <span aria-live="polite" className={styles.characterCount}>
            {value.length} / {maxLength}
          </span>
        </div>

        <div className={styles.actions}>
          <DialogClose asChild>
            <Button
              disabled={isLoading}
              fullWidth
              size="medium"
              variant="secondary"
            >
              취소
            </Button>
          </DialogClose>
          <Button
            disabled={!trimmedValue || trimmedValue === initialValue}
            fullWidth
            isLoading={isLoading}
            size="medium"
            type="submit"
          >
            변경 완료
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
