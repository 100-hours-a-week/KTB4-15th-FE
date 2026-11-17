"use client";

import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/shared/ui/button/button";
import { Dialog, DialogClose, DialogDescription, DialogTitle } from "./dialog";
import styles from "./confirm-dialog.module.scss";

type ConfirmDialogProps = {
  children?: ReactNode;
  confirmLabel: string;
  description: ReactNode;
  isLoading?: boolean;
  onCloseAutoFocus?: ComponentProps<typeof Dialog>["onCloseAutoFocus"];
  onConfirm: () => void;
  onExit?: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
};

export function ConfirmDialog({
  children,
  confirmLabel,
  description,
  isLoading = false,
  onCloseAutoFocus,
  onConfirm,
  onExit,
  onOpenChange,
  open,
  title,
}: ConfirmDialogProps) {
  return (
    <Dialog
      className={styles.dialog}
      onCloseAutoFocus={onCloseAutoFocus}
      onExit={onExit}
      onOpenChange={onOpenChange}
      open={open}
    >
      <DialogTitle className={styles.title}>{title}</DialogTitle>
      <DialogDescription className={styles.description}>
        {description}
      </DialogDescription>
      {children}
      <div className={styles.actions}>
        <DialogClose asChild>
          <Button fullWidth size="medium" variant="secondary">
            취소
          </Button>
        </DialogClose>
        <Button
          fullWidth
          isLoading={isLoading}
          onClick={onConfirm}
          size="medium"
          variant="danger"
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
