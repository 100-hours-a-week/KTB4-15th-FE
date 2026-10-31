"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState, type ReactNode } from "react";
import { recordPurchaseLinkClick } from "@/features/product";
import styles from "./ranking-row.module.scss";

const ImageViewerDialog = dynamic(() =>
  import("@/shared/ui/dialog").then((module) => module.ImageViewerDialog),
);

export function RankingImage({
  fallback,
  name,
  preload,
  src,
}: {
  fallback: ReactNode;
  name: string;
  preload: boolean;
  src: string;
}) {
  const [imageFailed, setImageFailed] = useState(!src);
  const [isImageOpen, setIsImageOpen] = useState(false);

  if (imageFailed) {
    return (
      <span className={styles.imageArea}>
        <span aria-label="상품 이미지 없음" className={styles.imageFallback}>
          {fallback}
        </span>
      </span>
    );
  }

  return (
    <>
      <button
        aria-label={`${name} 이미지 확대`}
        className={`${styles.imageArea} ${styles.imageButton}`}
        onClick={() => setIsImageOpen(true)}
        type="button"
      >
        <Image
          alt=""
          className={styles.image}
          fetchPriority={preload ? "high" : undefined}
          fill
          onError={() => setImageFailed(true)}
          preload={preload}
          sizes="80px"
          src={src}
        />
      </button>
      {isImageOpen && (
        <ImageViewerDialog
          alt={name}
          onError={() => setImageFailed(true)}
          onOpenChange={setIsImageOpen}
          open
          src={src}
        />
      )}
    </>
  );
}

export function RankingProductLink({
  children,
  name,
  productId,
  url,
}: {
  children: ReactNode;
  name: string;
  productId: number;
  url: string;
}) {
  return (
    <a
      aria-label={`${name} 구매 페이지로 이동`}
      className={styles.productLink}
      href={url}
      onClick={() => {
        void recordPurchaseLinkClick(productId).catch(() => undefined);
      }}
      rel="noopener noreferrer"
      target="_blank"
    >
      {children}
    </a>
  );
}
