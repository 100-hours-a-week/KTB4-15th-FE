import { z } from "zod";

const EMAIL_MAX_LENGTH = 254;
const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[\x21-\x7E]{8,20}$/;

export const emailSchema = z
  .string()
  .trim()
  .min(1, "이메일을 입력해주세요.")
  .max(
    EMAIL_MAX_LENGTH,
    "올바른 이메일 주소 형식을 입력해주세요. (e.g. look-ddak@example.com)",
  )
  .email(
    "올바른 이메일 주소 형식을 입력해주세요. (e.g. look-ddak@example.com)",
  );

export const newPasswordSchema = z
  .string()
  .min(1, "비밀번호를 입력해주세요.")
  .regex(
    PASSWORD_PATTERN,
    "비밀번호는 8자 이상, 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.",
  );

export const signupFormSchema = z
  .object({
    email: emailSchema,
    password: newPasswordSchema,
    confirmPassword: z.string().min(1, "비밀번호 확인을 입력해주세요."),
  })
  .refine(({ password, confirmPassword }) => password === confirmPassword, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["confirmPassword"],
  });

export const signupResponse = z.object({
  memberId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
});

export type SignupFormValues = z.infer<typeof signupFormSchema>;
export type SignupRequest = Pick<SignupFormValues, "email" | "password">;
