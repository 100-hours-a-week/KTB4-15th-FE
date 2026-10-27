import { Header, HeaderIconLink, HeaderTitle } from "@/shared/ui/header";
import { BackIcon } from "@/shared/ui/icon";
import cardStyles from "./fitting-wardrobe-card.module.scss";
import skeletonStyles from "./fitting-wardrobe-skeleton.module.scss";
import styles from "./fitting-wardrobe-screen.module.scss";

export function FittingWardrobeSkeleton() {
  return (
    <div
      aria-label="옷장을 불러오고 있어요"
      role="status"
      className={styles.list}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <div aria-hidden="true" className={cardStyles.productCard} key={index}>
          <span
            className={`${cardStyles.imageArea} ${skeletonStyles.skeleton}`}
          />
          <span
            className={`${cardStyles.productDetails} ${skeletonStyles.details}`}
          >
            <span
              className={`${skeletonStyles.skeleton} ${skeletonStyles.skeletonLabel}`}
            />
            <span
              className={`${skeletonStyles.skeleton} ${skeletonStyles.skeletonName}`}
            />
            <span
              className={`${skeletonStyles.skeleton} ${skeletonStyles.skeletonPrice}`}
            />
          </span>
        </div>
      ))}
    </div>
  );
}

export function FittingWardrobePageSkeleton() {
  return (
    <>
      <Header
        center={<HeaderTitle>피팅 목록</HeaderTitle>}
        left={
          <HeaderIconLink aria-label="피팅으로 돌아가기" href="/fitting">
            <BackIcon />
          </HeaderIconLink>
        }
      />
      <div className={styles.screen}>
        <div className={styles.intro}>
          <h2>입어볼 옷을 선택해 주세요</h2>
          <p>채팅방에서 담아둔 상품이에요</p>
        </div>
        <div aria-label="상품 종류" className={styles.filters}>
          {["상의", "하의", "전체"].map((label) => (
            <button disabled key={label} type="button">
              {label}
            </button>
          ))}
        </div>
        <FittingWardrobeSkeleton />
      </div>
    </>
  );
}
