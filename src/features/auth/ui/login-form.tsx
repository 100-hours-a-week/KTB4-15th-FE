"use client";

import Link from "next/link";
import { useState, type KeyboardEvent } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { clearFittingSelection } from "@/features/fitting/store/fitting-selection-store";
import { memberMeQueryOptions } from "@/features/member";
import { ApiError, getApiErrorMessage } from "@/shared/api/error";
import { Button, IconButton } from "@/shared/ui/button";
import { PasswordVisibilityIcon } from "@/shared/ui/icon";
import { InputField } from "@/shared/ui/input-field";
import { showToast } from "@/shared/ui/toast";
import styles from "./login-form.module.scss";
import { loginSchema, type LoginRequest } from "../schema/auth";
import { login } from "../api/auth";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";

export function LoginForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const {
    formState: { errors, isSubmitted, isValid, touchedFields, isSubmitting },
    handleSubmit,
    register,
    setError,
    setFocus,
  } = useForm<LoginRequest>({
    mode: "onChange",
    resolver: zodResolver(loginSchema),
  });

  const handleLogin = async ({ email, password }: LoginRequest) => {
    try {
      const { profileCompleted } = await login({ email, password });
      clearFittingSelection();
      queryClient.setQueryData(memberMeQueryOptions.queryKey, {
        profileCompleted,
      });
      router.replace(profileCompleted ? "/chat" : "/profile/setup");
    } catch (error) {
      if (error instanceof ApiError && error.code === "INVALID_CREDENTIALS") {
        setError(
          "password",
          {
            message: "이메일 또는 비밀번호가 올바르지 않습니다.",
          },
          { shouldFocus: true },
        );
        return;
      }

      showToast.error(
        getApiErrorMessage(error, "이메일 또는 비밀번호를 확인해 주세요."),
        {
          id: "login",
        },
      );
    }
  };

  const focusPasswordOnEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;

    event.preventDefault();
    setFocus("password");
  };

  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={handleSubmit(handleLogin)}
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
          onKeyDown={focusPasswordOnEnter}
          placeholder="looker@lookddak.com"
          required
          showRequiredMark={false}
          reserveHelperSpace
          type="email"
        />
        <InputField
          {...register("password")}
          autoComplete="current-password"
          enterKeyHint="done"
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
          required
          reserveHelperSpace
          showRequiredMark={false}
          type={isPasswordVisible ? "text" : "password"}
        />
      </div>
      <div className={styles.actions}>
        <Button
          disabled={!isValid || isSubmitting}
          fullWidth
          size="medium"
          type="submit"
        >
          {isSubmitting ? "로그인 중..." : "로그인"}
        </Button>
        <p className={styles.signupPrompt}>
          아직 계정이 없으신가요? <Link href="/signup">회원가입</Link>
        </p>
      </div>
    </form>
  );
}
