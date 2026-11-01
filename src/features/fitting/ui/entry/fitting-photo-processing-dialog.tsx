"use client";

import {
  Dialog,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog/dialog";
import { Spinner } from "@/shared/ui/spinner";
import styles from "./fitting-full-body-photo-section.module.scss";

export function FittingPhotoProcessingDialog() {
  return (
    <Dialog
      aria-busy="true"
      className={styles.processingDialog}
      onEscapeKeyDown={(event) => event.preventDefault()}
      onOpenChange={() => undefined}
      onPointerDownOutside={(event) => event.preventDefault()}
      open
    >
      <Spinner className={styles.processingSpinner} />
      <DialogTitle className={styles.processingTitle}>
        사진을 확인하고 있어요
      </DialogTitle>
      <DialogDescription className={styles.processingDescription}>
        처리가 끝날 때까지 잠시만 기다려 주세요.
      </DialogDescription>
    </Dialog>
  );
}
