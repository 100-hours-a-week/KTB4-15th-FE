"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button, IconButton } from "@/shared/ui/button";
import { PasswordVisibilityIcon } from "@/shared/ui/icon";
import { InputField } from "@/shared/ui/input-field";
import styles from "./login-form.module.scss";
import { loginSchema, type LoginRequest } from "../schema/auth";
import { login } from "../api/auth";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";

export function LoginForm() {
  const router = useRouter();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const {
    formState: { errors, isValid, touchedFields, isSubmitting },
    handleSubmit,
    register,
  } = useForm<LoginRequest>({
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(loginSchema),
  });

  const handleLogin = async ({ email, password }: LoginRequest) => {
    const { profileCompleted } = await login({ email, password });
    router.replace(profileCompleted ? "/chat" : "/profile/setup");
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
          error={errors.email?.message}
          helperText={
            touchedFields.email && !errors.email
              ? undefined
              : "가입하신 이메일 주소를 입력해주세요."
          }
          label="이메일"
          placeholder="looker@lookddak.com"
          required
          showRequiredMark={false}
          reserveHelperSpace
          type="email"
        />
        <InputField
          {...register("password")}
          autoComplete="current-password"
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
          error={errors.password?.message}
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
