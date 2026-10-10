"use client";

import Image, { type ImageLoaderProps } from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useFullBodyPhoto } from "@/features/profile/hooks/use-full-body-photo";
import {
  memberProfileQueryOptions,
  useUpdateFullBodyImageMutation,
} from "@/features/profile/model/member-profile-query";
import { getApiErrorMessage } from "@/shared/api/error";
import { Button } from "@/shared/ui/button";
import { RefreshIcon } from "@/shared/ui/icon";
import { showToast } from "@/shared/ui/toast";
import styles from "./fitting-photo-card.module.scss";

function passthroughImageLoader({ src }: ImageLoaderProps) {
  return src;
}

export function FittingPhotoCard() {
  const { data: memberProfile } = useQuery(memberProfileQueryOptions);
  const updatePhotoMutation = useUpdateFullBodyImageMutation();
  const {
    displayedErrorMessage,
    fileInputRef,
    handlePhotoChange,
    isPending: isValidationPending,
    openPhotoPicker,
  } = useFullBodyPhoto({
    onValidationChange: (validationId) => {
      if (!validationId) {
        updatePhotoMutation.reset();
        return;
      }

      updatePhotoMutation.mutate(validationId, {
        onError: (error) => {
          showToast.error(
            getApiErrorMessage(
              error,
              "전신 사진을 저장하지 못했어요. 다시 시도해 주세요.",
            ),
            { id: "update-full-body-image" },
          );
        },
        onSuccess: () => {
          showToast.success("전신 사진을 등록했어요.", {
            id: "update-full-body-image",
          });
        },
      });
    },
  });
  const fullBodyImageUrl = memberProfile?.fullBodyImageUrl;
  const isPhotoPending = isValidationPending || updatePhotoMutation.isPending;

  return (
    <section aria-label="내 전신 사진" className={styles.photoSection}>
      <div className={styles.card}>
        {fullBodyImageUrl ? (
          <>
            <Image
              alt=""
              aria-hidden="true"
              className={styles.imageBackdrop}
              fill
              loader={passthroughImageLoader}
              sizes="(max-width: 480px) calc(100vw - 40px), 380px"
              src={fullBodyImageUrl}
            />
            <Image
              alt="가상 피팅에 사용할 등록된 전신 사진"
              className={styles.image}
              fill
              loader={passthroughImageLoader}
              loading="eager"
              sizes="(max-width: 480px) calc(100vw - 40px), 380px"
              src={fullBodyImageUrl}
            />
          </>
        ) : (
          <p className={styles.emptyPhoto}>
            가상 피팅을 위한 전신 사진이 필요해요.
          </p>
        )}
        <input
          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
          hidden
          onChange={handlePhotoChange}
          ref={fileInputRef}
          type="file"
        />
        <Button
          className={`${styles.photoAction} ${styles.changePhotoButton}`}
          isLoading={isPhotoPending}
          leadingIcon={<RefreshIcon />}
          onClick={openPhotoPicker}
          size="small"
          type="button"
          variant="outlined"
        >
          사진 {fullBodyImageUrl ? "변경" : "등록"}
        </Button>
      </div>
      <p
        aria-live="polite"
        className={styles.photoError}
        role={displayedErrorMessage ? "alert" : undefined}
      >
        {displayedErrorMessage}
      </p>
    </section>
  );
}
