"use client";

import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import styles from "./pagination-status.module.scss";

type PaginationStatusProps = {
  isLoading: boolean;
  isError: boolean;
  loadingLabel: string;
  errorMessage: string;
  onRetry: () => void;
};

export function PaginationStatus({
  isLoading,
  isError,
  loadingLabel,
  errorMessage,
  onRetry,
}: PaginationStatusProps) {
  if (isLoading) {
    return (
      <span className={styles.loading}>
        <Spinner label={loadingLabel} />
      </span>
    );
  }
  if (!isError) return null;
  return (
    <div className={styles.error} role="alert">
      <p>{errorMessage}</p>
      <Button onClick={onRetry} size="small" variant="secondary">
        다시 시도
      </Button>
    </div>
  );
}
