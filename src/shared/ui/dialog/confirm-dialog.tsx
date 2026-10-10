"use client";

import { Button } from "@/shared/ui/button";
import { Dialog, DialogClose, DialogDescription, DialogTitle } from "./dialog";
import styles from "./confirm-dialog.module.scss";

type ConfirmDialogProps = {
  confirmLabel: string;
  description: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onExit?: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
};

export function ConfirmDialog({
  confirmLabel,
  description,
  isLoading = false,
  onConfirm,
  onExit,
  onOpenChange,
  open,
  title,
}: ConfirmDialogProps) {
  return (
    <Dialog
      className={styles.dialog}
      onExit={onExit}
      onOpenChange={onOpenChange}
      open={open}
    >
      <DialogTitle className={styles.title}>{title}</DialogTitle>
      <DialogDescription className={styles.description}>
        {description}
      </DialogDescription>
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
