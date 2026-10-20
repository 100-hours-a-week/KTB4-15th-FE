"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMarkFittingResultViewedMutation } from "@/features/fitting";
import { Button } from "@/shared/ui/button";
import { showToast } from "@/shared/ui/toast";
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
  const markViewedMutation = useMarkFittingResultViewedMutation();
  const action = isSuccess ? (
    <Link
      className={styles.action}
      href={`/fitting/jobs/${item.targetId}/result?from=notifications`}
      onClick={() => {
        if (!item.isRead) void onRead();
      }}
    >
      피팅 결과 확인하기 ›
    </Link>
  ) : (
    <Button
      className={styles.action}
      isLoading={markViewedMutation.isPending}
      onClick={async () => {
        if (!item.isRead) void onRead();

        try {
          await markViewedMutation.mutateAsync(item.targetId);
          router.push("/fitting");
        } catch {
          showToast.error("실패한 피팅 작업을 정리하지 못했어요.");
        }
      }}
      size="small"
      variant="text"
    >
      다시 피팅하기 ›
    </Button>
  );
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
        {action}
        <time dateTime={item.createdAt}>
          {formatKoreanNumericDateTime(item.createdAt)}
        </time>
      </div>
    </>
  );

  return <article className={styles.card}>{content}</article>;
}
