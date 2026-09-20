"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useRef, type ReactNode } from "react";
import { IconButton } from "@/shared/ui/button";
import styles from "./bottom-sheet.module.scss";

type BottomSheetSize = "content" | "large";
const EXIT_DURATION_MS = 300;

export type BottomSheetProps = {
  children: ReactNode;
  description?: string;
  eyebrow?: string;
  onExit?: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  size?: BottomSheetSize;
  title?: string;
};

function CloseIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path
        d="m6 6 12 12M18 6 6 18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function BottomSheet({
  children,
  description,
  eyebrow,
  onExit,
  onOpenChange,
  open,
  size = "content",
  title,
}: BottomSheetProps) {
  const hasOpenedRef = useRef(false);

  useEffect(() => {
    if (open) {
      hasOpenedRef.current = true;
      return;
    }

    if (!hasOpenedRef.current || !onExit) return;

    const timeoutId = window.setTimeout(onExit, EXIT_DURATION_MS);
    return () => window.clearTimeout(timeoutId);
  }, [onExit, open]);

  return (
    <Dialog.Root onOpenChange={onOpenChange} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.backdrop} />
        <Dialog.Content
          {...(!description ? { "aria-describedby": undefined } : {})}
          className={`${styles.bottomSheet} ${styles[size]}`}
        >
          <header className={styles.header}>
            <div className={styles.heading}>
              {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
              <Dialog.Title
                className={title ? styles.title : styles.visuallyHidden}
              >
                {title ?? "바텀 시트"}
              </Dialog.Title>
              {description && (
                <Dialog.Description className={styles.description}>
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <IconButton aria-label="닫기" size="medium">
                <CloseIcon />
              </IconButton>
            </Dialog.Close>
          </header>
          <div className={styles.body}>{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
