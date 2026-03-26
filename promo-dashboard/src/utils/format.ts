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

/**
 * 다양한 날짜 형식을 YYYY-MM-DD로 정규화
 */
export function normalizeDate(input: string): string {
  const trimmed = input.trim().replace(/[./]/g, '-');
  if (/^\d{8}$/.test(trimmed)) {
    return `${trimmed.slice(0, 4)}-${trimmed.slice(4, 6)}-${trimmed.slice(6, 8)}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  return input;
}

/**
 * startDate~endDate 사이의 일수 계산
 */
export function countDays(startDate: string, endDate: string): number {
  const s = new Date(normalizeDate(startDate));
  const e = new Date(normalizeDate(endDate));
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 1;
  const diff = e.getTime() - s.getTime();
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)) + 1);
}
