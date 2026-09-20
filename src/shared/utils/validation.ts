const EMAIL_MAX_LENGTH = 254;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 20;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s])[^\s]{8,20}$/;

export function normalizeEmail(value: string) {
  return value.trim();
}

export function validateEmail(value: string) {
  const email = normalizeEmail(value);

  if (!email) {
    return "이메일을 입력해주세요.";
  }

  if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
    return "올바른 이메일 주소 형식을 입력해주세요. (e.g. look-ddak@example.com)";
  }

  return undefined;
}

export function validatePassword(value: string) {
  if (!value) {
    return "비밀번호를 입력해주세요.";
  }

  if (
    value.length < PASSWORD_MIN_LENGTH ||
    value.length > PASSWORD_MAX_LENGTH ||
    !PASSWORD_PATTERN.test(value)
  ) {
    return "비밀번호는 8자 이상, 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.";
  }

  return undefined;
}