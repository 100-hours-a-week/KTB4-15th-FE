"use client";

import Image, { type ImageLoaderProps } from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/shared/ui/button";
import { AiFittingIcon, ChevronRightIcon, HeartIcon } from "@/shared/ui/icon";
import { formatPrice } from "@/shared/utils/price-format";
import { createFittingJob } from "../api/fitting-jobs";
import { setActiveFittingJobId } from "../model/active-fitting-job-storage";
import { useFittingSelectionStore } from "../model/fitting-selection-store";
import type { FittingCandidate } from "../schema/fitting-candidate";
import styles from "./fitting-selection-panel.module.scss";

type ItemType = "TOP" | "BOTTOM";

function passthroughImageLoader({ src }: ImageLoaderProps) {
  return src;
}

function EmptyProductIcon({ label }: { label: string }) {
  return (
    <div aria-hidden="true" className={styles.emptyProductIcon}>
      <HeartIcon />
      <small>{label}</small>
    </div>
  );
}

function OutfitItem({
  category,
  itemType,
  label,
  product,
}: {
  category: string;
  itemType: ItemType;
  label: string;
  product: FittingCandidate | null;
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
        {product ? (
          <span className={styles.productImageArea}>
            <Image
              alt=""
              className={styles.productImage}
              fill
              loader={passthroughImageLoader}
              sizes="56px"
              src={product.productImageUrl}
            />
          </span>
        ) : (
          <EmptyProductIcon label={label} />
        )}
        <span className={styles.productCopy}>
          <strong>{product?.productName ?? "선택 안 함"}</strong>
          <span>{product?.color ?? "입어볼 옷을 선택해 주세요"}</span>
          <b>{product ? formatPrice(product.currentPrice) : "0원"}</b>
        </span>
        <ChevronRightIcon className={styles.productChevron} />
      </Link>
    </div>
  );
}

export function FittingSelectionPanel() {
  const router = useRouter();
  const top = useFittingSelectionStore((state) => state.top);
  const bottom = useFittingSelectionStore((state) => state.bottom);
  const selectedCount = Number(Boolean(top)) + Number(Boolean(bottom));
  const canStart = selectedCount > 0;
  const createFittingJobMutation = useMutation({
    mutationFn: createFittingJob,
    onSuccess: ({ fittingJobId }) => {
      setActiveFittingJobId(fittingJobId);
      router.push(`/fitting/jobs/${fittingJobId}`);
    },
  });

  const handleStartFitting = () => {
    if (!top && !bottom) return;

    createFittingJobMutation.mutate({
      ...(top && { topProductId: top.productId }),
      ...(bottom && { bottomProductId: bottom.productId }),
    });
  };

  return (
    <div className={styles.panel}>
      <section className={styles.section}>
        <div className={styles.heading}>
          <div className={styles.title}>
            <h2>선택된 착장 아이템</h2>
            <span>{selectedCount}/2 선택</span>
          </div>
          <Link className={styles.changeLink} href="/fitting/wardrobe">
            변경
            <ChevronRightIcon />
          </Link>
        </div>

        <div className={styles.outfitCard}>
          <OutfitItem
            category="상의 / TOP"
            itemType="TOP"
            label="상의"
            product={top}
          />
          <div className={styles.divider} />
          <OutfitItem
            category="하의 / BOTTOM"
            itemType="BOTTOM"
            label="하의"
            product={bottom}
          />
        </div>
      </section>

      <div className={styles.actionArea}>
        <p>상의 또는 하의를 선택하면 피팅을 시작할 수 있어요</p>
        <Button
          disabled={!canStart}
          fullWidth
          isLoading={createFittingJobMutation.isPending}
          leadingIcon={<AiFittingIcon />}
          onClick={handleStartFitting}
          size="large"
          trailingIcon={<span aria-hidden="true">→</span>}
        >
          AI 가상 피팅 시작하기
        </Button>
        {createFittingJobMutation.isError && (
          <p aria-live="polite" className={styles.errorMessage} role="status">
            피팅 요청을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.
          </p>
        )}
      </div>
    </div>
  );
}
