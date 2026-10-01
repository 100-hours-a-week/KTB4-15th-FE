"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type KeyboardEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button, IconButton } from "@/shared/ui/button";
import { ApiError, getApiErrorMessage } from "@/shared/api/error";
import { PasswordVisibilityIcon } from "@/shared/ui/icon";
import { InputField } from "@/shared/ui/input-field";
import { showToast } from "@/shared/ui/toast";
import { signupFormSchema, type SignupFormValues } from "../schema/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { signup } from "../api/auth";
import styles from "./signup-form.module.scss";

export function SignupForm() {
  const router = useRouter();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);
  const {
    control,
    formState: { errors, isSubmitted, isSubmitting, isValid, touchedFields },
    handleSubmit,
    register,
    setError,
    setFocus,
    trigger,
  } = useForm<SignupFormValues>({
    mode: "onChange",
    resolver: zodResolver(signupFormSchema),
  });

  const password = useWatch({ control, name: "password", defaultValue: "" });

  const confirmation = useWatch({
    control,
    name: "confirmPassword",
    defaultValue: "",
  });

  useEffect(() => {
    if (confirmation) {
      void trigger("confirmPassword");
    }
  }, [confirmation, password, trigger]);

  const handleSignup = async ({ email, password }: SignupFormValues) => {
    try {
      await signup({ email, password });
      showToast.success("회원가입이 완료됐어요.", { id: "signup" });
      router.replace("/login");
    } catch (error) {
      if (error instanceof ApiError && error.code === "EMAIL_ALREADY_EXISTS") {
        setError(
          "email",
          { message: "이미 사용 중인 이메일입니다." },
          { shouldFocus: true },
        );
        return;
      }

      showToast.error(
        getApiErrorMessage(error, "회원가입에 실패했어요. 다시 시도해 주세요."),
        { id: "signup" },
      );
    }
  };

  const focusFieldOnEnter = (
    event: KeyboardEvent<HTMLInputElement>,
    nextField: "password" | "confirmPassword",
  ) => {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;

    event.preventDefault();
    setFocus(nextField);
  };

  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={handleSubmit(handleSignup)}
    >
      <div className={styles.fields}>
        <InputField
          {...register("email")}
          autoComplete="email"
          enterKeyHint="next"
          error={
            touchedFields.email || isSubmitted
              ? errors.email?.message
              : undefined
          }
          helperText={
            touchedFields.email && !errors.email
              ? undefined
              : "가입하신 이메일 주소를 입력해주세요."
          }
          label="이메일"
          onKeyDown={(event) => focusFieldOnEnter(event, "password")}
          required
          showRequiredMark={false}
          type="email"
        />
        <InputField
          {...register("password")}
          autoComplete="new-password"
          enterKeyHint="next"
          endAdornment={
            <IconButton
              aria-label={
                isPasswordVisible ? "비밀번호 숨기기" : "비밀번호 표시"
              }
              onClick={() => setIsPasswordVisible((visible) => !visible)}
              size="medium"
            >
              <PasswordVisibilityIcon
                isVisible={isPasswordVisible}
                key={String(isPasswordVisible)}
              />
            </IconButton>
          }
          error={
            touchedFields.password || isSubmitted
              ? errors.password?.message
              : undefined
          }
          helperText={
            touchedFields.password && !errors.password
              ? undefined
              : "영문, 숫자, 대문자, 소문자, 특수문자를 포함해 8자 이상 입력해주세요."
          }
          label="비밀번호"
          onKeyDown={(event) => focusFieldOnEnter(event, "confirmPassword")}
          required
          showRequiredMark={false}
          type={isPasswordVisible ? "text" : "password"}
        />
        <InputField
          {...register("confirmPassword")}
          autoComplete="new-password"
          enterKeyHint="done"
          endAdornment={
            <IconButton
              aria-label={
                isConfirmPasswordVisible
                  ? "비밀번호 확인 숨기기"
                  : "비밀번호 확인 표시"
              }
              onClick={() => setIsConfirmPasswordVisible((visible) => !visible)}
              size="medium"
            >
              <PasswordVisibilityIcon
                isVisible={isConfirmPasswordVisible}
                key={String(isConfirmPasswordVisible)}
              />
            </IconButton>
          }
          error={
            touchedFields.confirmPassword || isSubmitted
              ? errors.confirmPassword?.message
              : undefined
          }
          label="비밀번호 확인"
          required
          showRequiredMark={false}
          success={
            touchedFields.confirmPassword &&
            confirmation &&
            password === confirmation &&
            !errors.confirmPassword
              ? "비밀번호가 일치해요."
              : undefined
          }
          type={isConfirmPasswordVisible ? "text" : "password"}
        />
      </div>
      <div className={styles.actions}>
        <Button
          disabled={!isValid || isSubmitting}
          fullWidth
          isLoading={isSubmitting}
          size="medium"
          type="submit"
        >
          {isSubmitting ? "가입하고 있어요" : "회원가입"}
        </Button>
        <p className={styles.loginPrompt}>
          이미 회원이신가요? <Link href="/login">로그인</Link>
        </p>
      </div>
    </form>
  );
}
