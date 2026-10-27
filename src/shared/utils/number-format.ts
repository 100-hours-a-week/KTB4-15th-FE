const compactNumberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 0,
  roundingMode: "trunc",
});

export function formatCompactNumber(value: number) {
  return compactNumberFormatter.format(value);
}
