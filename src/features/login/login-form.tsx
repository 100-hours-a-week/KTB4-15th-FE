"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button, IconButton } from "@/shared/ui/button";
import { InputField } from "@/shared/ui/input-field";
import {
  normalizeEmail,
  validateEmail,
  validatePassword,
} from "@/shared/utils/validation";
import styles from "./login-form.module.scss";

type LoginFormValues = {
  email: string;
  password: string;
};

function EyeIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24">
      <path
        d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24">
      <path
        d="m3 3 18 18M10.6 6.2A9.6 9.6 0 0 1 12 6c5.5 0 9 6 9 6a16 16 0 0 1-3.1 3.7M6.1 6.9C4 8.5 3 12 3 12s3.5 6 9 6c1 0 1.9-.2 2.7-.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function LoginForm() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const {
    formState: { errors, isValid, touchedFields },
    handleSubmit,
    register,
  } = useForm<LoginFormValues>({
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={handleSubmit(() => undefined)}
    >
      <div className={styles.fields}>
        <InputField
          {...register("email", {
            setValueAs: normalizeEmail,
            validate: validateEmail,
          })}
          autoComplete="email"
          error={errors.email?.message}
          helperText={
            touchedFields.email && !errors.email
              ? undefined
              : "가입하신 이메일 주소를 입력해주세요."
          }
          label="이메일"
          name="email"
          placeholder="looker@lookddak.com"
          required
          showRequiredMark={false}
          reserveHelperSpace
          type="email"
        />
        <InputField
          {...register("password", {
            validate: validatePassword,
          })}
          autoComplete="current-password"
          endAdornment={
            <IconButton
              aria-label={
                isPasswordVisible ? "비밀번호 숨기기" : "비밀번호 표시"
              }
              onClick={() => setIsPasswordVisible((visible) => !visible)}
              size="medium"
            >
              <span
                className={styles.passwordIcon}
                key={String(isPasswordVisible)}
              >
                {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
              </span>
            </IconButton>
          }
          error={errors.password?.message}
          helperText={
            touchedFields.password && !errors.password
              ? undefined
              : "영문, 숫자, 대문자, 소문자, 특수문자를 포함해 8자 이상 입력해주세요."
          }
          label="비밀번호"
          name="password"
          required
          reserveHelperSpace
          showRequiredMark={false}
          type={isPasswordVisible ? "text" : "password"}
        />
      </div>
      <div className={styles.actions}>
        <Button disabled={!isValid} fullWidth size="medium" type="submit">
          로그인
        </Button>
        <p className={styles.signupPrompt}>
          아직 계정이 없으신가요? <Link href="/signup">회원가입</Link>
        </p>
      </div>
    </form>
  );
}