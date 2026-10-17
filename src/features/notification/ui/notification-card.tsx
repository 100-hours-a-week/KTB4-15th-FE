"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { formatKoreanNumericDateTime } from "@/shared/utils/date-format";
import type { NotificationItem } from "../schema/notification";
import styles from "./notification-screen.module.scss";

export function NotificationCard({
  item,
  onRead,
}: {
  item: NotificationItem;
  onRead: () => Promise<boolean>;
}) {
  const router = useRouter();
  const isSuccess = item.type === "FITTING_SUCCESS";
  const content = (
    <>
      <div className={styles.cardHeader}>
        <span className={isSuccess ? styles.successBadge : styles.failureBadge}>
          {isSuccess ? "피팅 완료" : "피팅 실패"}
        </span>
        <span className={styles.readState}>
          {item.isRead ? "읽음" : "안 읽음"}
        </span>
      </div>
      <p className={styles.message}>
        {isSuccess
          ? `${item.payload.outfitName}이 생성되었어요.`
          : "가상 피팅 생성에 실패했습니다."}
      </p>
      <div className={styles.cardFooter}>
        <Link
          className={styles.action}
          href={
            isSuccess
              ? `/fitting/jobs/${item.targetId}/result?from=notifications`
              : "/fitting"
          }
          onClick={async (event: MouseEvent<HTMLAnchorElement>) => {
            if (item.isRead) return;
            if (isSuccess) {
              void onRead();
              return;
            }

            event.preventDefault();
            if (await onRead()) router.push("/fitting");
          }}
        >
          {isSuccess ? "피팅 결과 확인하기" : "다시 피팅하기"} ›
        </Link>
        <time dateTime={item.createdAt}>
          {formatKoreanNumericDateTime(item.createdAt)}
        </time>
      </div>
    </>
  );

  return <article className={styles.card}>{content}</article>;
}
