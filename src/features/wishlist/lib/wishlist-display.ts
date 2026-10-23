export function getPriceChangeText(
  priceChangeRate: number,
  wishedPrice: number,
  currentPrice: number,
) {
  if (currentPrice === wishedPrice) return "가격 변동 없음";

  const direction = currentPrice < wishedPrice ? "↓" : "↑";
  return priceChangeRate === 0
    ? `1% 미만 ${direction}`
    : `${Math.abs(priceChangeRate)}% ${direction}`;
}
