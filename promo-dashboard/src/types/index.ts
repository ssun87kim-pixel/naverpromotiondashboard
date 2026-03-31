// ============================================================
// 판매성과 파일 (Sales_Performance_File)
// ============================================================

export interface SalesRow {
  date: string;        // YYYY-MM-DD
  dayOfWeek: string;   // 월~일
  hour?: number;       // 0~23 (시간대 컬럼 있을 때)
  paymentAmount: number;
  refundAmount: number;
  couponTotal: number;
}

export interface SalesPerformanceData {
  rows: SalesRow[];
  dateRange: { start: string; end: string };
}

// ============================================================
// 상품성과 파일 (Product_Performance_File)
// ============================================================

export interface ProductRawRow {
  productId: string;
  productName: string;
  categoryLarge: string;
  categoryMedium: string;
  categorySmall: string;
  paymentCount: number;
  paymentQty: number;
  paymentAmount: number;
  couponTotal: number;
  productCoupon: number;
  orderCoupon: number;
  refundCount: number;
  refundAmount: number;
  refundQty: number;
  refundRate?: number;    // 파일의 환불비율 컬럼 (있을 때)
}

export interface ProductPerformanceData {
  rows: ProductRawRow[];
}

// ============================================================
// 카테고리 파일 (Category_File)
// ============================================================

export interface CategoryRow {
  productCode: string;
  division: string;    // 구분
  largeCat: string;    // 대분류
  mediumCat: string;   // 중분류
  smallCat: string;    // 소분류
  productName: string; // 상품명(컬러제외)
}

export interface CategoryData {
  rows: CategoryRow[];
}

// ============================================================
// 병합 데이터 (카테고리 매칭 후)
// ============================================================

export interface MergedProductRow extends ProductRawRow {
  division: string;
  largeCat: string;
  isMatched: boolean; // 카테고리 매칭 여부
}

export interface MergedProductData {
  rows: MergedProductRow[];
}

// ============================================================
// 분석 결과 모델
// ============================================================

export interface KpiSummary {
  netSales: number;           // 결제금액 - 환불금액
  achievementRate: number | null; // (netSales / targetAmount) × 100, targetAmount=0이면 null
  paymentAmount: number;      // 결제금액
  paymentCount: number;       // 결제수
  couponTotal: number;        // 쿠폰합계 (상품성과 파일 기준)
  refundAmount: number;       // 환불액
  refundRate: number;         // (환불건수 / 결제수) × 100
  avgOrderValue: number | null; // 순매출 / 주문건수, paymentCount=0이면 null
}

export interface DailyTimeSeries {
  date: string;
  dayOfWeek: string;
  paymentAmount: number;
  refundAmount: number;
  netSales: number;
  couponTotal: number;
  isLiveDate: boolean;
  isPeak: boolean;
}

export interface HourlyData {
  hour: number;
  paymentAmount: number;
}

export interface ProductRow {
  division: string;
  largeCat: string;
  productName: string;
  productId: string;
  qty: number;
  qtyShare: number;       // 전체 대비 판매수량 비중 (%)
  netAmount: number;      // 결제금액 - 환불금액
  amountShare: number;    // 전체 결제금액 대비 비중 (%)
  refundCount: number;
  refundRate: number;     // 환불수량 / 전체 주문수량 × 100
  isHighRefund: boolean;  // 평균 환불율 초과 여부
  isUnmatched: boolean;   // 카테고리 미매칭 여부
}

// ============================================================
// 영속성 모델 (Persistence)
// ============================================================

export interface PromotionRecord {
  id: string;
  eventName: string;
  channel: string;
  startDate: string;
  endDate: string;
  liveDates: string[];
  liveStartHour?: number;  // 0~23 라이브 시작시간
  liveEndHour?: number;    // 0~23 라이브 종료시간
  targetAmount: number;
  promotionType: string;
  planningIntent: string;
  createdAt: string;
  updatedAt: string;
}

export interface LiveDayResult {
  date: string;
  netSales: number;
}

export interface Reply {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  promotionId: string;
  authorName: string;
  content: string;
  createdAt: string;
  replies: Reply[];
}

// ============================================================
// 파싱 결과 타입
// ============================================================

export type ParseResult<T> =
  | { ok: true; data: T; warnings: ParseWarning[] }
  | { ok: false; error: ParseError };

export interface ParseError {
  code: 'INVALID_FORMAT' | 'MISSING_COLUMNS' | 'EMPTY_FILE';
  message: string;
  missingColumns?: string[];
}

export interface ParseWarning {
  code: 'DATE_RANGE_MISMATCH';
  message: string;
  detail: { expected: string; actual: string };
}

export interface WeekdayRow {
  dayOfWeek: string;
  order: number;
  paymentAmount: number;
  refundAmount: number;
  netSales: number;
  couponTotal: number;
}
