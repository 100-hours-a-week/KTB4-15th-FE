"use client";

import { IconButton } from "@/shared/ui/button";
import { CloseIcon } from "@/shared/ui/icon";
import { Dialog, DialogClose, DialogTitle } from "./dialog";
import styles from "./image-viewer-dialog.module.scss";

type ImageViewerDialogProps = {
  alt: string;
  onError?: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  src: string;
};

export function ImageViewerDialog({
  alt,
  onError,
  onOpenChange,
  open,
  src,
}: ImageViewerDialogProps) {
  return (
    <Dialog
      aria-describedby={undefined}
      className={styles.dialog}
      onOpenChange={onOpenChange}
      open={open}
    >
      <DialogTitle className={styles.visuallyHidden}>{alt}</DialogTitle>
      <DialogClose asChild>
        <IconButton
          aria-label="이미지 확대 화면 닫기"
          className={styles.closeButton}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogClose>
      <div className={styles.imageArea}>
        {/* 원본 비율로 다이얼로그 크기를 잡아 닫기 버튼을 이미지 모서리에 붙인다. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={alt} className={styles.image} onError={onError} src={src} />
      </div>
    </Dialog>
  );
}
