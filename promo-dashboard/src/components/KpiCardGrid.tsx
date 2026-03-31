import React from 'react';
import KpiCard from './KpiCard';
import type { KpiSummary, DailyTimeSeries, PromotionRecord, LiveDayResult } from '../types/index';
import { formatCurrency, formatNumber, formatRate } from '../utils/format';

interface KpiCardGridProps {
  kpis: KpiSummary;
  targetAmount: number;
  hasSales: boolean;
  hasProducts: boolean;
  context: PromotionRecord | null;
  timeSeries: DailyTimeSeries[];
  liveNetSales: LiveDayResult[];
}


const KpiCardGrid: React.FC<KpiCardGridProps> = ({ kpis, targetAmount: _targetAmount, hasSales, hasProducts, context, timeSeries, liveNetSales }) => {
  const achievementStatus =
    kpis.achievementRate === null
      ? 'neutral'
      : kpis.achievementRate >= 100
      ? 'achieved'
      : 'not-achieved';

  // ── 1행: 기존 KPI 카드 ──
  const allCards = [
    { label: '순매출', value: formatCurrency(kpis.netSales), status: 'neutral' as const, needsSales: true },
    { label: '달성률', value: formatRate(kpis.achievementRate), status: achievementStatus as 'achieved' | 'not-achieved' | 'neutral', needsSales: true },
    { label: '결제금액', value: formatCurrency(kpis.paymentAmount), status: 'neutral' as const, needsSales: true },
    { label: '결제수', value: formatNumber(kpis.paymentCount), unit: '건', status: 'neutral' as const, needsProducts: true },
    { label: '객단가', value: kpis.avgOrderValue !== null ? formatCurrency(kpis.avgOrderValue) : '-', status: 'neutral' as const, needsSales: true, needsProducts: true },
    { label: '쿠폰합계', value: formatCurrency(kpis.couponTotal), status: 'neutral' as const, needsProducts: true },
    { label: '환불액', value: formatCurrency(kpis.refundAmount), status: 'neutral' as const, needsSales: true },
    { label: '환불률(금액기준)', value: formatRate(kpis.refundRate), status: 'neutral' as const, isInverted: true, needsSales: true },
  ];

  const row1 = allCards.filter((card: typeof allCards[number]) => {
    if ('needsSales' in card && card.needsSales && !hasSales) return false;
    if ('needsProducts' in card && card.needsProducts && !hasProducts) return false;
    return true;
  });

  // ── 2행: 일평균 순매출 + 라이브일자 순매출 ──
  const row2: { label: string; value: string; status: 'neutral' }[] = [];

  if (hasSales && timeSeries.length > 0) {
    const dailyAvg = Math.round(kpis.netSales / timeSeries.length);
    row2.push({ label: '일평균 순매출', value: formatCurrency(dailyAvg), status: 'neutral' });
  }

  if (hasSales && liveNetSales.length > 0) {
    if (liveNetSales.length === 1) {
      row2.push({ label: '라이브 순매출', value: formatCurrency(liveNetSales[0].netSales), status: 'neutral' });
    } else {
      const liveTotal = liveNetSales.reduce((sum, d) => sum + d.netSales, 0);
      row2.push({ label: '라이브 합계', value: formatCurrency(liveTotal), status: 'neutral' });
      liveNetSales.forEach((day, i) => {
        row2.push({ label: `라이브 ${i + 1}일차 (${day.date.slice(5)})`, value: formatCurrency(day.netSales), status: 'neutral' });
      });
    }
  }

  if (row1.length === 0 && row2.length === 0) return null;

  // 2행 그리드 컬럼 수를 1행과 동일하게 맞춤
  const gridCols = row1.length;

  const eventLabel = context?.eventName || '이번 행사';
  const periodLabel = context?.startDate && context?.endDate
    ? `${context.startDate} ~ ${context.endDate}`
    : '';

  return (
    <div className="flex flex-col gap-3 bg-white border border-gray-200 rounded-lg p-4">
      {/* 행사명 + 기간 */}
      <div className="flex items-baseline gap-2 border-l-4 border-blue pl-2">
        <span className="text-sm font-semibold text-gray-800">{eventLabel}</span>
        {periodLabel && <span className="text-xs text-gray-500">{periodLabel}</span>}
      </div>
      {/* 1행 */}
      {row1.length > 0 && (
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}>
          {row1.map((card) => (
            <KpiCard
              key={card.label}
              label={card.label}
              value={card.value}
              unit={card.unit}
              status={card.status}
              isInverted={card.isInverted}
            />
          ))}
        </div>
      )}
      {/* 2행 */}
      {row2.length > 0 && (
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}>
          {row2.map((card) => (
            <KpiCard
              key={card.label}
              label={card.label}
              value={card.value}
              status={card.status}
            />
          ))}
        </div>
      )}
      {/* 기획의도/주요혜택 */}
      {context?.planningIntent && (
        <div className="bg-white border border-gray-200 rounded-lg p-3 w-full">
          <span className="text-sm font-bold text-gray-900">기획의도/주요혜택</span>
          <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{context.planningIntent}</p>
        </div>
      )}
    </div>
  );
};

export default KpiCardGrid;
