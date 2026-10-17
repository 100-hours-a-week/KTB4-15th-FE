import Link from "next/link";
import { formatKoreanNumericDateTime } from "@/shared/utils/date-format";
import type { NotificationItem } from "../schema/notification";
import styles from "./notification-list-screen.module.scss";

export function NotificationCard({ item }: { item: NotificationItem }) {
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
        {isSuccess && (
          <span className={styles.action}>피팅 결과 확인하기 ›</span>
        )}
        <time dateTime={item.createdAt}>
          {formatKoreanNumericDateTime(item.createdAt)}
        </time>
      </div>
    </>
  );

  return isSuccess ? (
    <Link
      className={styles.card}
      href={`/fitting/jobs/${item.targetId}/result`}
    >
      {content}
    </Link>
  ) : (
    <article className={styles.card}>{content}</article>
  );
}
