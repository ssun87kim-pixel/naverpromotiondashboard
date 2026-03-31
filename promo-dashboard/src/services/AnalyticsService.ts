import type {
  SalesPerformanceData,
  ProductPerformanceData,
  MergedProductData,
  KpiSummary,
  DailyTimeSeries,
  HourlyData,
  ProductRow,
  LiveDayResult,
} from '../types/index';

// ============================================================
// KPI 계산
// ============================================================

export function computeKpis(
  sales: SalesPerformanceData | null,
  products: ProductPerformanceData | null,
  targetAmount: number
): KpiSummary {
  const paymentAmount = sales ? sales.rows.reduce((sum, r) => sum + r.paymentAmount, 0) : 0;
  const refundAmount = sales ? sales.rows.reduce((sum, r) => sum + r.refundAmount, 0) : 0;
  const netSales = paymentAmount - refundAmount;

  const achievementRate =
    targetAmount > 0 && sales
      ? Math.round((netSales / targetAmount) * 1000) / 10
      : null;

  const paymentCount = products ? products.rows.reduce((sum, r) => sum + r.paymentCount, 0) : 0;
  const refundCount = products ? products.rows.reduce((sum, r) => sum + r.refundCount, 0) : 0;
  const couponTotal = products ? products.rows.reduce((sum, r) => sum + r.couponTotal, 0) : 0;

  const refundRate =
    paymentAmount > 0
      ? Math.round((refundAmount / paymentAmount) * 1000) / 10
      : 0;

  const avgOrderValue =
    sales && products && paymentCount > 0
      ? Math.round(netSales / paymentCount)
      : null;

  return {
    netSales,
    achievementRate,
    paymentAmount,
    paymentCount,
    couponTotal,
    refundAmount,
    refundRate,
    avgOrderValue,
  };
}

// ============================================================
// 시계열 데이터 계산
// ============================================================

export function computeTimeSeries(
  sales: SalesPerformanceData,
  liveDates: string[] = []
): DailyTimeSeries[] {
  // 날짜별 집계
  const map = new Map<
    string,
    { dayOfWeek: string; paymentAmount: number; refundAmount: number; couponTotal: number }
  >();

  for (const row of sales.rows) {
    const existing = map.get(row.date);
    if (existing) {
      existing.paymentAmount += row.paymentAmount;
      existing.refundAmount += row.refundAmount;
      existing.couponTotal += row.couponTotal;
    } else {
      map.set(row.date, {
        dayOfWeek: row.dayOfWeek,
        paymentAmount: row.paymentAmount,
        refundAmount: row.refundAmount,
        couponTotal: row.couponTotal,
      });
    }
  }

  // 라이브 날짜 형식 정규화 (빈 문자열 제거, YYYYMMDD → YYYY-MM-DD 변환)
  const liveDateSet = new Set(
    liveDates
      .filter((d) => d.trim().length > 0)
      .map((d) => {
        const t = d.trim().replace(/[./]/g, '-');
        if (/^\d{8}$/.test(t)) return `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}`;
        return t;
      })
  );

  const series: DailyTimeSeries[] = Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      dayOfWeek: v.dayOfWeek,
      paymentAmount: v.paymentAmount,
      refundAmount: v.refundAmount,
      netSales: v.paymentAmount - v.refundAmount,
      couponTotal: v.couponTotal,
      isLiveDate: liveDateSet.has(date),
      isPeak: false,
    }));

  // Peak 플래그: netSales 최대값 행만 true
  if (series.length > 0) {
    const maxNet = Math.max(...series.map((s) => s.netSales));
    for (const s of series) {
      s.isPeak = s.netSales === maxNet;
    }
  }

  return series;
}

// ============================================================
// 시간대별 데이터 계산
// ============================================================

export function computeHourly(
  sales: SalesPerformanceData,
  date?: string
): HourlyData[] {
  // 0~23 모두 초기화
  const map = new Map<number, number>();
  for (let h = 0; h < 24; h++) {
    map.set(h, 0);
  }

  const filtered = date
    ? sales.rows.filter((r) => r.date === date && r.hour !== undefined)
    : sales.rows.filter((r) => r.hour !== undefined);

  for (const row of filtered) {
    const h = row.hour!;
    if (h >= 0 && h <= 23) {
      map.set(h, (map.get(h) ?? 0) + row.paymentAmount);
    }
  }

  return Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    paymentAmount: map.get(h) ?? 0,
  }));
}

// ============================================================
// 상품별 성과 계산
// ============================================================

export function computeProductStats(merged: MergedProductData): ProductRow[] {
  const rows = merged.rows;
  if (rows.length === 0) return [];

  const totalQty = rows.reduce((sum, r) => sum + r.paymentQty, 0);

  // netAmount = paymentAmount - refundAmount
  const totalNetAmount = rows.reduce(
    (sum, r) => sum + (r.paymentAmount - r.refundAmount),
    0
  );

  // 각 상품의 refundRate: 파일에 환불비율 컬럼이 있으면 사용, 없으면 계산
  const perRowRefundRates = rows.map((r) =>
    r.refundRate !== undefined
      ? r.refundRate
      : r.paymentQty > 0 ? (r.refundQty / r.paymentQty) * 100 : 0
  );

  // 평균 환불율 = 각 상품 refundRate의 산술 평균 (합계용)
  const avgRefundRate =
    perRowRefundRates.length > 0
      ? perRowRefundRates.reduce((s, v) => s + v, 0) / perRowRefundRates.length
      : 0;

  const productRows: ProductRow[] = rows.map((r, i) => {
    const netAmount = r.paymentAmount - r.refundAmount;
    const qtyShare = totalQty > 0 ? (r.paymentQty / totalQty) * 100 : 0;
    const amountShare =
      totalNetAmount > 0 ? (netAmount / totalNetAmount) * 100 : 0;
    const refundRate = perRowRefundRates[i];

    return {
      division: r.division,
      largeCat: r.largeCat,
      productName: r.productName,
      productId: r.productId,
      qty: r.paymentQty,
      qtyShare,
      netAmount,
      amountShare,
      refundCount: r.refundCount,
      refundRate,
      isHighRefund: refundRate > avgRefundRate,
      isUnmatched: !r.isMatched,
    };
  });

  // division → largeCat → productName 사전순 정렬
  productRows.sort((a, b) => {
    const d = a.division.localeCompare(b.division, 'ko');
    if (d !== 0) return d;
    const l = a.largeCat.localeCompare(b.largeCat, 'ko');
    if (l !== 0) return l;
    return a.productName.localeCompare(b.productName, 'ko');
  });

  return productRows;
}

// ============================================================
// 요일별 집계
// ============================================================

export interface WeekdayRow {
  dayOfWeek: string;
  order: number; // 0=월 ~ 6=일
  paymentAmount: number;
  refundAmount: number;
  netSales: number;
  couponTotal: number;
}

const DOW_ORDER: Record<string, number> = {
  '월': 0, '화': 1, '수': 2, '목': 3, '금': 4, '토': 5, '일': 6,
};

export function computeWeekdaySummary(sales: SalesPerformanceData): WeekdayRow[] {
  const map = new Map<string, { paymentAmount: number; refundAmount: number; couponTotal: number }>();

  for (const row of sales.rows) {
    const dow = row.dayOfWeek || '기타';
    const existing = map.get(dow);
    if (existing) {
      existing.paymentAmount += row.paymentAmount;
      existing.refundAmount += row.refundAmount;
      existing.couponTotal += row.couponTotal;
    } else {
      map.set(dow, {
        paymentAmount: row.paymentAmount,
        refundAmount: row.refundAmount,
        couponTotal: row.couponTotal,
      });
    }
  }

  return Array.from(map.entries())
    .map(([dow, v]) => ({
      dayOfWeek: dow,
      order: DOW_ORDER[dow] ?? 7,
      paymentAmount: v.paymentAmount,
      refundAmount: v.refundAmount,
      netSales: v.paymentAmount - v.refundAmount,
      couponTotal: v.couponTotal,
    }))
    .sort((a, b) => a.order - b.order);
}

// ============================================================
// 라이브 순매출 계산 (시간대 필터링)
// ============================================================

export function computeLiveNetSales(
  sales: SalesPerformanceData,
  liveDates: string[],
  startHour?: number,
  endHour?: number
): LiveDayResult[] {
  const normalizedDates = liveDates
    .filter((d) => d.trim().length > 0)
    .map((d) => {
      const t = d.trim().replace(/[./]/g, '-');
      if (/^\d{8}$/.test(t)) return `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}`;
      return t;
    });

  if (normalizedDates.length === 0) return [];

  const hasHourFilter = startHour !== undefined && endHour !== undefined;

  return normalizedDates.map((ld) => {
    const filtered = sales.rows.filter((r) => {
      if (r.date !== ld) return false;
      if (hasHourFilter && r.hour !== undefined) {
        return r.hour >= startHour! && r.hour <= endHour!;
      }
      return true;
    });
    const netSales = filtered.reduce((sum, r) => sum + r.paymentAmount - r.refundAmount, 0);
    return { date: ld, netSales };
  }).sort((a, b) => a.date.localeCompare(b.date));
}
