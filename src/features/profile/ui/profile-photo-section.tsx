import { useEffect } from "react";
import Image from "next/image";
import { overlay } from "overlay-kit";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { Button } from "@/shared/ui/button";
import { InfoIcon } from "@/shared/ui/icon";
import { useFullBodyPhoto } from "../hooks/use-full-body-photo";
import { FullBodyImageGuide } from "./full-body-image-guide";
import styles from "./profile-setup-form.module.scss";

type ProfilePhotoSectionProps = {
  onPendingChange: (isPending: boolean) => void;
  onValidationChange: (validationId?: number) => void;
  validationId?: number;
};

export function ProfilePhotoSection({
  onPendingChange,
  onValidationChange,
  validationId,
}: ProfilePhotoSectionProps) {
  const {
    displayedErrorMessage,
    fileInputRef,
    handlePhotoChange,
    isPending,
    openPhotoPicker,
    photoUrl,
  } = useFullBodyPhoto({ onValidationChange });

  useEffect(() => {
    onPendingChange(isPending);
  }, [isPending, onPendingChange]);

  const openFullBodyImageGuide = () => {
    overlay.open(({ close, isOpen, unmount }) => (
      <BottomSheet
        description="더 자연스러운 가상 피팅을 위해 아래 내용을 확인해주세요."
        eyebrow="PHOTO GUIDE"
        onExit={unmount}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) close();
        }}
        open={isOpen}
        title="전신 사진 촬영 가이드"
      >
        <FullBodyImageGuide
          onStartShooting={() => {
            close();
            openPhotoPicker();
          }}
        />
      </BottomSheet>
    ));
  };

  return (
    <section className={styles.photoSection}>
      <h3>전신 사진</h3>
      <p>가상 피팅을 이용하려면 정면 전신 사진이 필요합니다.</p>
      <div className={styles.photoCard}>
        <button
          aria-label="전신 사진 선택"
          className={styles.photoPreview}
          disabled={isPending}
          onClick={openPhotoPicker}
          type="button"
        >
          {photoUrl ? (
            // Blob URLs are local previews and cannot be handled by next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="선택한 전신 사진 미리보기" src={photoUrl} />
          ) : (
            <Image
              alt="전신 사진 촬영 예시"
              height={128}
              src="/images/profile/full-body-example.png"
              width={96}
            />
          )}
        </button>
        <input
          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
          className={styles.fileInput}
          onChange={handlePhotoChange}
          ref={fileInputRef}
          type="file"
        />
        <div className={styles.photoDetails}>
          <strong
            className={
              displayedErrorMessage && !validationId
                ? styles.photoStatusError
                : validationId
                  ? styles.photoStatusSuccess
                  : undefined
            }
          >
            <i aria-hidden="true" />{" "}
            {isPending
              ? "사진을 검증하고 있어요"
              : validationId
                ? "사진 검증이 완료되었어요"
                : displayedErrorMessage
                  ? "사진 검증 중 오류가 발생했어요"
                  : "전신 사진을 등록해 주세요"}
          </strong>
          <p
            className={
              displayedErrorMessage ? styles.photoInlineError : undefined
            }
            role={displayedErrorMessage ? "alert" : undefined}
          >
            {displayedErrorMessage ??
              "실제 체형 비율을 반영해 자연스러운 가상 착용을 구현해요."}
          </p>
          <div className={styles.photoActions}>
            <Button
              isLoading={isPending}
              onClick={openPhotoPicker}
              size="small"
              type="button"
              variant="secondary"
            >
              사진 {photoUrl ? "변경" : "등록"}
            </Button>
            <button
              className={styles.guideButton}
              onClick={openFullBodyImageGuide}
              type="button"
            >
              <InfoIcon /> 촬영 가이드
            </button>
          </div>
        </div>
        <p className={styles.photoTip}>
          * JPG·PNG / 최대 10MB / 짧은 변 480px 이상 / 전체 2,500만 픽셀 이하
        </p>
      </div>
    </section>
  );
}
