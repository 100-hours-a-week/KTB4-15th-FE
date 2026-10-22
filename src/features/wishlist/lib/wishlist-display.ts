export function getPriceChangeText(priceChangeRate: number) {
  if (priceChangeRate === 0) return "가격 변동 없음";
  return `${Math.abs(priceChangeRate)}% ${priceChangeRate < 0 ? "↓" : "↑"}`;
}
