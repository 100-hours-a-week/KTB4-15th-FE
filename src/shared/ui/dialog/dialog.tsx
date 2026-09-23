"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { useEffect, useRef, type ComponentPropsWithoutRef } from "react";
import styles from "./dialog.module.scss";

const EXIT_DURATION_MS = 200;

export type DialogProps = ComponentPropsWithoutRef<
  typeof RadixDialog.Content
> & {
  onExit?: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function Dialog({
  children,
  className,
  onExit,
  onOpenChange,
  open,
  ...contentProps
}: DialogProps) {
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

  const contentClassName = [styles.dialog, className].filter(Boolean).join(" ");

  return (
    <RadixDialog.Root onOpenChange={onOpenChange} open={open}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={styles.backdrop} />
        <RadixDialog.Content {...contentProps} className={contentClassName}>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

export const DialogClose = RadixDialog.Close;
export const DialogDescription = RadixDialog.Description;
export const DialogTitle = RadixDialog.Title;
