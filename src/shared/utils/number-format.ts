export function formatCompactNumber(value: number) {
  if (value < 1000) return value.toLocaleString("ko-KR");

  return `${(value / 1000).toFixed(1).replace(".0", "")}k`;
}
