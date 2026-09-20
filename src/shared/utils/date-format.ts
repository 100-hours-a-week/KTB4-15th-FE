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
