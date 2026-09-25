import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { AiFittingIcon, ChevronRightIcon, HeartIcon } from "@/shared/ui/icon";
import styles from "./fitting-selection-panel.module.scss";

type ItemType = "TOP" | "BOTTOM";

function EmptyProductIcon({ label }: { label: string }) {
  return (
    <div aria-hidden="true" className={styles.emptyProductIcon}>
      <HeartIcon />
      <small>{label}</small>
    </div>
  );
}

function EmptyOutfitItem({
  category,
  itemType,
  label,
}: {
  category: string;
  itemType: ItemType;
  label: string;
}) {
  return (
    <div className={styles.outfitGroup}>
      <span className={styles.category}>
        <span className={styles.dot} />
        {category}
      </span>
      <Link
        aria-label={`피팅할 ${label} 선택하기`}
        className={styles.productRow}
        href={`/fitting/wardrobe?itemType=${itemType}`}
      >
        <EmptyProductIcon label={label} />
        <span className={styles.productCopy}>
          <strong>선택 안 함</strong>
          <span>입어볼 옷을 선택해 주세요</span>
          <b>0원</b>
        </span>
        <ChevronRightIcon className={styles.productChevron} />
      </Link>
    </div>
  );
}

export function FittingSelectionPanel() {
  return (
    <div className={styles.panel}>
      <section className={styles.section}>
        <div className={styles.heading}>
          <div className={styles.title}>
            <h2>선택된 착장 아이템</h2>
            <span>0/2 선택</span>
          </div>
          <Link className={styles.changeLink} href="/fitting/wardrobe">
            변경
            <ChevronRightIcon />
          </Link>
        </div>

        <div className={styles.outfitCard}>
          <EmptyOutfitItem category="상의 / TOP" itemType="TOP" label="상의" />
          <div className={styles.divider} />
          <EmptyOutfitItem
            category="하의 / BOTTOM"
            itemType="BOTTOM"
            label="하의"
          />
        </div>
      </section>

      <div className={styles.actionArea}>
        <p>상의와 하의를 선택하면 피팅을 시작할 수 있어요</p>
        <Button
          disabled
          fullWidth
          leadingIcon={<AiFittingIcon />}
          size="large"
          trailingIcon={<span aria-hidden="true">→</span>}
        >
          AI 가상 피팅 시작하기
        </Button>
      </div>
    </div>
  );
}
