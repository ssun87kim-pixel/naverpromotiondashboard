/**
 * 숫자를 3자리 쉼표 구분으로 포맷 (예: 1234567 → "1,234,567")
 */
export function formatNumber(value: number): string {
  return value.toLocaleString('ko-KR');
}

/**
 * 금액을 ₩ + 3자리 쉼표 구분으로 포맷 (예: 1234567 → "₩1,234,567")
 */
export function formatCurrency(value: number): string {
  return '₩' + value.toLocaleString('ko-KR');
}

/**
 * 비율을 소수점 1자리로 포맷 (예: 87.333 → "87.3%")
 */
export function formatRate(value: number | null): string {
  if (value === null) return '-';
  return value.toFixed(1) + '%';
}

/**
 * 입력 문자열에서 쉼표 제거 후 숫자 반환
 */
export function parseFormattedNumber(value: string): number {
  const cleaned = value.replace(/,/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}
