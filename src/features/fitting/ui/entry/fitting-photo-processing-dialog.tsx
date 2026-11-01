"use client";

import {
  Dialog,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog/dialog";
import { LoadingDots } from "@/shared/ui/loading-message";
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
      <DialogTitle className={styles.processingTitle}>
        사진을 확인하고 있어요
        <LoadingDots />
      </DialogTitle>
      <DialogDescription className={styles.processingDescription}>
        처리가 끝날 때까지 잠시만 기다려 주세요.
      </DialogDescription>
    </Dialog>
  );
}
