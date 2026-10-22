const NAME_MAX_LENGTH = 10;
export const NAME_PATTERN = /^[가-힣A-Za-z0-9]+(?: [가-힣A-Za-z0-9]+)*$/;
const DECIMAL_INPUT_PATTERN = /^\d{0,3}(?:\.\d?)?$/;

export function normalizeName(value: string) {
  return value.trim();
}

export function validateName(value: string) {
  const name = normalizeName(value);

  if (!name) return "이름을 입력해주세요.";
  if (name.length > NAME_MAX_LENGTH) {
    return "이름은 최대 10자까지 작성 가능합니다.";
  }
  if (!NAME_PATTERN.test(name)) {
    return "이름은 한글, 영어, 숫자를 사용하고, 단어 사이는 한 칸만 띄어주세요.";
  }

  return undefined;
}

export function sanitizeDecimalInput(value: string) {
  if (DECIMAL_INPUT_PATTERN.test(value)) return value;

  const [integer = "", ...decimalParts] = value
    .replace(/[^\d.]/g, "")
    .split(".");
  const sanitizedInteger = integer.slice(0, 3);

  if (!value.includes(".")) return sanitizedInteger;

  return `${sanitizedInteger}.${decimalParts.join("").slice(0, 1)}`;
}

function validateOptionalRange(
  value: string,
  options: {
    max: number;
    min: number;
    rangeMessage: string;
  },
) {
  if (!value) return undefined;

  const numericValue = Number(value);
  if (
    !Number.isFinite(numericValue) ||
    numericValue < options.min ||
    numericValue > options.max
  ) {
    return options.rangeMessage;
  }

  return undefined;
}

export function validateAge(value: string) {
  if (!value) return undefined;

  const numericValue = Number(value);
  if (!Number.isInteger(numericValue)) return "나이는 정수로 입력해주세요.";
  if (numericValue < 1) {
    return "나이는 1세 이상이어야 합니다.";
  }
  if (numericValue > 100) return "나이는 100세까지 가능합니다.";

  return undefined;
}

export function validateHeight(value: string) {
  return validateOptionalRange(value, {
    max: 250,
    min: 100,
    rangeMessage: "키는 100 ~ 250cm까지 가능합니다.",
  });
}

export function validateWeight(value: string) {
  return validateOptionalRange(value, {
    max: 200,
    min: 30,
    rangeMessage: "몸무게는 30 ~ 200kg까지 가능합니다.",
  });
}
