"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import styles from "./global-error.module.scss";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ko">
      <body className={styles.body}>
        <main className={styles.main}>
          <section className={styles.card}>
            <h1 className={styles.title}>문제가 발생했어요</h1>
            <p className={styles.description}>
              잠시 후 다시 시도해 주세요. 문제가 계속되면 새로고침해 주세요.
            </p>
            <button className={styles.button} onClick={reset} type="button">
              다시 시도
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
