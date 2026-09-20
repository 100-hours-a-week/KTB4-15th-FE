"use client";

import Image from "next/image";
import { overlay } from "overlay-kit";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useForm } from "react-hook-form";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { Button, Toggle } from "@/shared/ui/button";
import { InputField } from "@/shared/ui/input-field";
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

type ProfileSetupFormValues = {
  name: string;
  age: string;
  height: string;
  weight: string;
};

function InfoIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 9v4M10 6.7h.01"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function ProfileSetupForm() {
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(true);
  const [photoUrl, setPhotoUrl] = useState<string>();
  const fileInputRef = useRef<HTMLInputElement>(null);
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

    setPhotoUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      return URL.createObjectURL(file);
    });
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
            fileInputRef.current?.click();
          }}
        />
      </BottomSheet>
    ));
  };

  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={handleSubmit(() => undefined)}
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
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            {photoUrl ? (
              // Blob URLs are local previews and cannot be handled by next/image.
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="선택한 전신 사진 미리보기" src={photoUrl} />
            ) : (
              <Image
                alt="전신 사진 촬영 예시"
                height={88}
                src="/images/profile/full-body-example.png"
                width={68}
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
            <strong>
              <i aria-hidden="true" />{" "}
              {photoUrl ? "사진이 등록되었어요" : "전신 사진을 등록해 주세요"}
            </strong>
            <p>실제 체형 비율을 반영해 자연스러운 가상 착용을 구현해요.</p>
            <div className={styles.photoActions}>
              <Button
                onClick={() => fileInputRef.current?.click()}
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
          <p className={styles.photoTip}>
            * 정면 각도에서 전신이 모두 나오면 가장 정확해요.
          </p>
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
        disabled={!isValid || !photoUrl}
        fullWidth
        size="large"
        type="submit"
      >
        정보 등록하고 시작하기
      </Button>
    </form>
  );
}
