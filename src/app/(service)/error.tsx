"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import styles from "../global-error.module.scss";

export default function ServiceError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className={`${styles.main} ${styles.serviceMain}`}>
      <section className={styles.card}>
        <h1 className={styles.title}>화면을 불러오지 못했어요</h1>
        <p className={styles.description}>잠시 후 다시 시도해 주세요.</p>
        <button className={styles.button} onClick={retry} type="button">
          다시 시도
        </button>
      </section>
    </main>
  );
}
