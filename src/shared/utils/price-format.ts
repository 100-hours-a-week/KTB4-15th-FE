const koreanNumberFormatter = new Intl.NumberFormat("ko-KR");

export function formatPrice(price: number) {
  return `${koreanNumberFormatter.format(price)}원`;
}
