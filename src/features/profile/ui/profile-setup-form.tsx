"use client";

import { useState, type KeyboardEvent } from "react";
import { useForm } from "react-hook-form";
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
import { useProfileSetup } from "../hooks/use-profile-setup";
import { ProfilePhotoSection } from "./profile-photo-section";
import { ProfileSetupComplete } from "./profile-setup-complete";

type ProfileSetupFormValues = {
  name: string;
  age: string;
  height: string;
  weight: string;
};

export function ProfileSetupForm() {
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(true);
  const [isPhotoValidationPending, setIsPhotoValidationPending] =
    useState(false);
  const [photoValidationId, setPhotoValidationId] = useState<number>();
  const {
    isComplete,
    isPending: isProfileSetupPending,
    reset: resetProfileSetup,
    submit: submitProfileSetup,
  } = useProfileSetup();
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

  const handlePhotoValidationChange = (validationId?: number) => {
    if (!validationId) resetProfileSetup();
    setPhotoValidationId(validationId);
  };

  const handleProfileSubmit = (values: ProfileSetupFormValues) => {
    submitProfileSetup({
      age: values.age ? Number(values.age) : undefined,
      fullBodyImageValidationId: photoValidationId,
      height: values.height ? Number(values.height) : undefined,
      name: values.name,
      priceAlertEnabled: isNotificationEnabled,
      weight: values.weight ? Number(values.weight) : undefined,
    });
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    void handleSubmit(handleProfileSubmit)(event);
  };

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

  if (isComplete) return <ProfileSetupComplete />;

  return (
    <form className={styles.form} noValidate onSubmit={handleFormSubmit}>
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
            suffix="kg"
            type="text"
          />
        </div>
      </section>

      <ProfilePhotoSection
        onPendingChange={setIsPhotoValidationPending}
        onValidationChange={handlePhotoValidationChange}
        validationId={photoValidationId}
      />

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
        disabled={!isValid || isPhotoValidationPending}
        fullWidth
        isLoading={isProfileSetupPending}
        size="large"
        type="submit"
      >
        {isProfileSetupPending
          ? "정보를 등록하고 있어요"
          : "정보 등록하고 시작하기"}
      </Button>
    </form>
  );
}
