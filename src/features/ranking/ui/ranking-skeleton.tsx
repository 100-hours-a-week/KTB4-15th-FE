import rowStyles from "./ranking-row.module.scss";
import screenStyles from "./ranking-screen.module.scss";
import styles from "./ranking-skeleton.module.scss";

export function RankingSkeleton() {
  return (
    <div
      aria-label="랭킹 정보를 불러오고 있어요"
      className={styles.skeleton}
      role="status"
    >
      <div aria-hidden="true" className={screenStyles.list}>
        {Array.from({ length: 5 }, (_, index) => (
          <div className={rowStyles.row} key={index}>
            <span className={styles.short} />
            <span className={styles.image} />
            <div className={styles.details}>
              <span className={styles.line} />
              <span className={styles.short} />
            </div>
            <span className={styles.short} />
          </div>
        ))}
      </div>
    </div>
  );
}
