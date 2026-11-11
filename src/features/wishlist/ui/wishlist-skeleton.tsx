import rowStyles from "./wishlist-card.module.scss";
import screenStyles from "./wishlist-screen.module.scss";
import styles from "./wishlist-skeleton.module.scss";

export function WishlistSkeleton() {
  return (
    <div
      aria-label="찜 목록을 불러오고 있어요"
      className={styles.skeleton}
      role="status"
    >
      <div aria-hidden="true" className={styles.count} />
      <div aria-hidden="true" className={screenStyles.list}>
        {Array.from({ length: 5 }, (_, index) => (
          <div className={rowStyles.card} key={index}>
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
