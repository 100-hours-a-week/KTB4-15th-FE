"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { overlay } from "overlay-kit";
import { HTTPError } from "ky";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { memberMeQueryOptions } from "@/features/member";
import { OfflineError } from "@/shared/api/client";
import { getApiErrorMessage } from "@/shared/api/error";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useForm } from "react-hook-form";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { Button, Toggle } from "@/shared/ui/button";
import { InfoIcon } from "@/shared/ui/icon";
import { InputField } from "@/shared/ui/input-field";
import { showToast } from "@/shared/ui/toast";
import {
  normalizeName,
  sanitizeDecimalInput,
  validateAge,
  validateHeight,
  validateName,
  validateWeight,
} from "@/shared/utils/profile-validation";
import styles from "./profile-setup-form.module.scss";
import { ShootingGuide } from "./shooting-guide";
import { createMemberProfile, validateFullBodyImage } from "./api/profile";
import { memberProfileQueryOptions } from "./api/member-profile-query";

type ProfileSetupFormValues = {
  name: string;
  age: string;
  height: string;
  weight: string;
};

const PHOTO_VALIDATION_ERROR_CODES = new Set([
  "IMAGE_EMPTY",
  "IMAGE_FORMAT_UNSUPPORTED",
  "IMAGE_DECODE_FAILED",
  "IMAGE_RESOLUTION_TOO_SMALL",
  "PERSON_NOT_FOUND",
  "MULTIPLE_PERSONS",
  "PERSON_TOO_SMALL",
  "FULL_BODY_NOT_VISIBLE",
  "ARMS_NOT_VISIBLE",
  "LEGS_NOT_VISIBLE",
  "NOT_FRONTAL",
  "IMAGE_SIZE_EXCEEDED",
  "IMAGE_TOO_LARGE",
]);

class PhotoValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PhotoValidationError";
  }
}

function isApiErrorResponse(
  value: unknown,
): value is { code: string; message: string } {
  if (typeof value !== "object" || value === null) return false;

  const response = value as Record<string, unknown>;
  return (
    typeof response.code === "string" && typeof response.message === "string"
  );
}

async function rethrowPhotoValidationError(error: unknown): Promise<never> {
  if (error instanceof OfflineError) throw error;

  if (error instanceof HTTPError) {
    const responseBody: unknown = await error.response
      .clone()
      .json()
      .catch(() => undefined);

    if (
      isApiErrorResponse(responseBody) &&
      PHOTO_VALIDATION_ERROR_CODES.has(responseBody.code)
    ) {
      throw new PhotoValidationError(responseBody.message);
    }
  }

  throw error;
}

export function ProfileSetupForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [photo, setPhoto] = useState<File>();
  const [photoUrl, setPhotoUrl] = useState<string>();
  const [photoValidationId, setPhotoValidationId] = useState<number>();
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const filePickerLockedRef = useRef(false);
  const photoValidationRequestIdRef = useRef(0);
  const {
    clearErrors,
    formState: { errors, isValid },
    handleSubmit,
    register,
    setError,
    setFocus,
    setValue,
  } = useForm<ProfileSetupFormValues>({ mode: "onChange" });
  const nameField = register("name", { validate: validateName });
  const photoValidationMutation = useMutation({
    mutationFn: ({ image }: { image: File; requestId: number }) =>
      validateFullBodyImage(image).catch(rethrowPhotoValidationError),
    onSuccess: ({ fullBodyImageUrl, validationId }, { requestId }) => {
      if (requestId !== photoValidationRequestIdRef.current) return;

      setPhotoValidationId(validationId);
      setPhotoUrl(fullBodyImageUrl);
    },
    onError: (error, { requestId }) => {
      if (requestId !== photoValidationRequestIdRef.current) return;

      setPhotoValidationId(undefined);

      if (error instanceof PhotoValidationError) return;

      showToast.error(
        getApiErrorMessage(
          error,
          "전신 사진을 검증하지 못했어요. 다시 시도해 주세요.",
        ),
        { id: "photo-validation" },
      );
    },
  });
  const profileSetupMutation = useMutation({
    mutationFn: async ({
      age,
      height,
      name,
      weight,
    }: ProfileSetupFormValues) => {
      if (!photo) throw new PhotoValidationError("전신 사진을 등록해 주세요.");
      if (!photoValidationId) {
        throw new PhotoValidationError("전신 사진 검증을 완료해 주세요.");
      }

      return createMemberProfile({
        age: Number(age),
        fullBodyImageValidationId: photoValidationId,
        height: Number(height),
        name,
        priceAlertEnabled: isNotificationEnabled,
        weight: Number(weight),
      });
    },
    onSuccess: async () => {
      queryClient.setQueryData(memberMeQueryOptions.queryKey, {
        profileCompleted: true,
      });
      await queryClient.invalidateQueries({
        queryKey: memberProfileQueryOptions.queryKey,
      });
      showToast.success("기본 정보가 등록됐어요.", { id: "profile-setup" });
      router.replace("/chat");
      router.refresh();
    },
    onError: (error) => {
      if (error instanceof PhotoValidationError) return;

      showToast.error(
        getApiErrorMessage(
          error,
          "기본 정보를 등록하지 못했어요. 다시 시도해 주세요.",
        ),
        { id: "profile-setup" },
      );
    },
  });
  const photoValidationError =
    photoValidationMutation.error instanceof PhotoValidationError
      ? photoValidationMutation.error
      : undefined;

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.value.length > 10) {
      setValue("name", event.target.value.slice(0, 10), {
        shouldDirty: true,
      });
      setError("name", {
        message: "*이름은 최대 10자까지 작성 가능합니다.",
        type: "maxLength",
      });
      return;
    }

    clearErrors("name");
    void nameField.onChange(event);
  };

  const handleNameBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const normalizedName = normalizeName(event.target.value);
    event.target.value = normalizedName;
    setValue("name", normalizedName, {
      shouldDirty: true,
      shouldValidate: true,
      shouldTouch: true,
    });
    void nameField.onBlur(event);
  };

  const restrictDecimalInput = (event: React.FormEvent<HTMLInputElement>) => {
    event.currentTarget.value = sanitizeDecimalInput(event.currentTarget.value);
  };

  const handleFieldEnter = (
    event: KeyboardEvent<HTMLInputElement>,
    nextField?: keyof ProfileSetupFormValues,
  ) => {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;

    event.preventDefault();

    if (nextField) {
      setFocus(nextField);
      return;
    }

    event.currentTarget.blur();
  };

  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    window.setTimeout(() => {
      filePickerLockedRef.current = false;
    }, 300);

    setPhoto(file);
    setPhotoValidationId(undefined);
    profileSetupMutation.reset();
    photoValidationMutation.reset();
    setPhotoUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      return URL.createObjectURL(file);
    });
    const requestId = photoValidationRequestIdRef.current + 1;
    photoValidationRequestIdRef.current = requestId;
    photoValidationMutation.mutate({ image: file, requestId });
  };

  const openPhotoPicker = () => {
    if (filePickerLockedRef.current || photoValidationMutation.isPending) {
      return;
    }

    const input = fileInputRef.current;
    if (!input) return;

    filePickerLockedRef.current = true;
    window.addEventListener(
      "focus",
      () => {
        window.setTimeout(() => {
          filePickerLockedRef.current = false;
        }, 300);
      },
      { once: true },
    );
    input.click();
  };

  const openShootingGuide = () => {
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
        <ShootingGuide
          onStartShooting={() => {
            close();
            openPhotoPicker();
          }}
        />
      </BottomSheet>
    ));
  };

  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={handleSubmit((values) => profileSetupMutation.mutate(values))}
    >
      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h3>기본 정보</h3>
        </div>
        <div className={styles.fields}>
          <InputField
            {...nameField}
            autoComplete="name"
            enterKeyHint="next"
            error={errors.name?.message}
            helperText="실명 또는 닉네임을 입력해 주세요."
            label="이름"
            onBlur={handleNameBlur}
            onChange={handleNameChange}
            onKeyDown={(event) => handleFieldEnter(event, "age")}
            placeholder="홍길동"
            required
          />
          <InputField
            {...register("age", { validate: validateAge })}
            error={errors.age?.message}
            enterKeyHint="next"
            helperText="만 나이 기준으로 입력해 주세요."
            inputMode="decimal"
            label="나이"
            onInput={restrictDecimalInput}
            onKeyDown={(event) => handleFieldEnter(event, "height")}
            placeholder="29"
            required
            suffix="세"
            type="text"
          />
          <InputField
            {...register("height", { validate: validateHeight })}
            error={errors.height?.message}
            enterKeyHint="next"
            helperText="가장 최근 신장의 계측치를 사용해요."
            inputMode="decimal"
            label="키"
            onInput={restrictDecimalInput}
            onKeyDown={(event) => handleFieldEnter(event, "weight")}
            placeholder="178"
            required
            suffix="cm"
            type="text"
          />
          <InputField
            {...register("weight", { validate: validateWeight })}
            error={errors.weight?.message}
            enterKeyHint="done"
            helperText="체형별 맞춤 핏 추천에 활용해요."
            inputMode="decimal"
            label="몸무게"
            onInput={restrictDecimalInput}
            onKeyDown={(event) => handleFieldEnter(event)}
            placeholder="72"
            required
            suffix="kg"
            type="text"
          />
        </div>
      </section>

      <section className={styles.photoSection}>
        <h3>
          전신 사진<span aria-hidden="true">*</span>
        </h3>
        <p>정면 전신 사진을 등록해야 회원 가입이 가능합니다.</p>
        <div className={styles.photoCard}>
          <button
            aria-label="전신 사진 선택"
            className={styles.photoPreview}
            disabled={photoValidationMutation.isPending}
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
            accept="image/*"
            className={styles.fileInput}
            onChange={handlePhotoChange}
            ref={fileInputRef}
            required
            type="file"
          />
          <div className={styles.photoDetails}>
            <strong
              className={
                photoValidationMutation.isError
                  ? styles.photoStatusError
                  : undefined
              }
            >
              <i aria-hidden="true" />{" "}
              {photoValidationMutation.isPending
                ? "사진을 검증하고 있어요"
                : photoValidationId
                  ? "사진 검증이 완료되었어요"
                  : photoUrl
                    ? "사진을 다시 확인해 주세요"
                    : "전신 사진을 등록해 주세요"}
            </strong>
            <p>실제 체형 비율을 반영해 자연스러운 가상 착용을 구현해요.</p>
            <div className={styles.photoActions}>
              <Button
                isLoading={photoValidationMutation.isPending}
                onClick={openPhotoPicker}
                size="small"
                type="button"
                variant="secondary"
              >
                사진 {photoUrl ? "변경" : "등록"}
              </Button>
              <button
                className={styles.guideButton}
                onClick={openShootingGuide}
                type="button"
              >
                <InfoIcon /> 촬영 가이드
              </button>
            </div>
          </div>
          {photoValidationId ? (
            <p className={styles.photoSuccess} role="status">
              전신 사진 검증에 성공했어요.
            </p>
          ) : (
            <p className={styles.photoTip}>
              * 정면 각도에서 전신이 모두 나오면 가장 정확해요.
            </p>
          )}
          {photoValidationError && (
            <p className={styles.photoError} role="alert">
              {photoValidationError.message}
            </p>
          )}
        </div>
      </section>

      <section className={styles.notificationSection}>
        <div>
          <h3>가격 하락 알림</h3>
          <p>찜한 상품의 가격이 내려가면 실시간으로 알려드려요.</p>
        </div>
        <Toggle
          aria-label="가격 하락 알림"
          checked={isNotificationEnabled}
          onCheckedChange={setIsNotificationEnabled}
        />
      </section>

      <Button
        className={styles.submitButton}
        disabled={
          !isValid ||
          !photo ||
          !photoValidationId ||
          photoValidationMutation.isPending
        }
        fullWidth
        isLoading={profileSetupMutation.isPending}
        size="large"
        type="submit"
      >
        {profileSetupMutation.isPending
          ? "정보를 등록하고 있어요"
          : "정보 등록하고 시작하기"}
      </Button>
    </form>
  );
}
