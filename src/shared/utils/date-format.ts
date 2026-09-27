const KOREA_TIME_ZONE = "Asia/Seoul";

type DateInput = Date | string | number;

function toDate(value: DateInput) {
  return value instanceof Date ? value : new Date(value);
}

export function formatKoreanDate(value: DateInput) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: KOREA_TIME_ZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(toDate(value));
}

export function formatKoreanTime(value: DateInput) {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: KOREA_TIME_ZONE,
  }).format(toDate(value));
}

export function formatKoreanRelativeDateTime(
  value: DateInput,
  now: Date = new Date(),
) {
  const date = toDate(value);
  const dateParts = getKoreanDateParts(date);
  const nowParts = getKoreanDateParts(now);

  if (
    dateParts.year === nowParts.year &&
    dateParts.month === nowParts.month &&
    dateParts.day === nowParts.day
  ) {
    return formatKoreanTime(date);
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: dateParts.year === nowParts.year ? undefined : "numeric",
    month: "long",
    day: "numeric",
    timeZone: KOREA_TIME_ZONE,
  }).format(date);
}

function getKoreanDateParts(value: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    timeZone: KOREA_TIME_ZONE,
  }).formatToParts(value);

  return Object.fromEntries(
    parts
      .filter(
        ({ type }) => type === "year" || type === "month" || type === "day",
      )
      .map(({ type, value: partValue }) => [type, Number(partValue)]),
  ) as Record<"year" | "month" | "day", number>;
}
