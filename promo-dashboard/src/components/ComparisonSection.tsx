import React from 'react';
import KpiCard from './KpiCard';
import type { KpiSummary, PromotionRecord, DailyTimeSeries } from '../types/index';
import { formatCurrency, formatRate, formatNumber } from '../utils/format';

interface ParsedInfo {
  hasSales: boolean;
  hasProducts: boolean;
}

interface ComparisonSectionProps {
  currentKpis: KpiSummary | null;
  currentParsed: ParsedInfo;
  currentContext: PromotionRecord | null;
  currentTimeSeries: DailyTimeSeries[];
  compareKpis: (KpiSummary | null)[];
  compareParsed: ParsedInfo[];
  compareTimeSeries: DailyTimeSeries[][];
  compareContexts: PromotionRecord[];
  onClose: (index: number) => void;
  onUpload: () => void;
}


interface KpiRow {
  label: string;
  getValue: (kpis: KpiSummary) => string;
  getStatus?: (kpis: KpiSummary) => 'achieved' | 'not-achieved' | 'neutral';
  isInverted?: boolean;
  needsSales?: boolean;
  needsProducts?: boolean;
}

const KPI_ROWS: KpiRow[] = [
  {
    label: '순매출',
    getValue: (k) => formatCurrency(k.netSales),
    needsSales: true,
  },
  {
    label: '달성률',
    getValue: (k) => formatRate(k.achievementRate),
    getStatus: (k) =>
      k.achievementRate === null
        ? 'neutral'
        : k.achievementRate >= 100
        ? 'achieved'
        : 'not-achieved',
    needsSales: true,
  },
  {
    label: '결제금액',
    getValue: (k) => formatCurrency(k.paymentAmount),
    needsSales: true,
  },
  {
    label: '결제수',
    getValue: (k) => formatNumber(k.paymentCount) + '건',
    needsProducts: true,
  },
  {
    label: '객단가',
    getValue: (k) => k.avgOrderValue !== null ? formatCurrency(k.avgOrderValue) : '-',
    needsSales: true,
    needsProducts: true,
  },
  {
    label: '쿠폰합계',
    getValue: (k) => formatCurrency(k.couponTotal),
    needsProducts: true,
  },
  {
    label: '환불액',
    getValue: (k) => formatCurrency(k.refundAmount),
    needsSales: true,
  },
  {
    label: '환불률',
    getValue: (k) => k.refundRate.toFixed(1) + '%',
    isInverted: true,
    needsProducts: true,
  },
];

function getKpiValue(row: KpiRow, kpis: KpiSummary | null, parsed: ParsedInfo): string {
  if (!kpis) return '-';
  if (row.needsSales && !parsed.hasSales) return '-';
  if (row.needsProducts && !parsed.hasProducts) return '-';
  return row.getValue(kpis);
}

function getKpiStatus(row: KpiRow, kpis: KpiSummary | null, parsed: ParsedInfo): 'achieved' | 'not-achieved' | 'neutral' {
  if (!kpis || !row.getStatus) return 'neutral';
  if (row.needsSales && !parsed.hasSales) return 'neutral';
  if (row.needsProducts && !parsed.hasProducts) return 'neutral';
  return row.getStatus(kpis);
}

function countDays(startDate: string, endDate: string): number {
  const s = new Date(startDate);
  const e = new Date(endDate);
  const diff = e.getTime() - s.getTime();
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)) + 1);
}

interface ColumnProps {
  title: string;
  subtitle?: string;
  kpis: KpiSummary | null;
  parsed: ParsedInfo;
  context?: PromotionRecord | null;
  colTimeSeries?: DailyTimeSeries[];
  onClose?: () => void;
}

const ComparisonColumn: React.FC<ColumnProps> = ({ title, subtitle, kpis, parsed, context, colTimeSeries = [], onClose }) => {
  // 2행 카드: 일평균 순매출 + 라이브일자 순매출
  const extraCards: { label: string; value: string }[] = [];

  if (parsed.hasSales && kpis && context?.startDate && context?.endDate) {
    const days = countDays(context.startDate, context.endDate);
    const dailyAvg = Math.round(kpis.netSales / days);
    extraCards.push({ label: '일평균 순매출', value: formatCurrency(dailyAvg) });
  } else if (!parsed.hasSales) {
    extraCards.push({ label: '일평균 순매출', value: '-' });
  }

  if (parsed.hasSales) {
    const liveDays = colTimeSeries.filter((d) => d.isLiveDate);
    if (liveDays.length === 1) {
      extraCards.push({ label: '라이브 순매출', value: formatCurrency(liveDays[0].netSales) });
    } else if (liveDays.length >= 2) {
      const liveTotal = liveDays.reduce((sum, d) => sum + d.netSales, 0);
      extraCards.push({ label: '라이브 합계', value: formatCurrency(liveTotal) });
      liveDays.forEach((day, i) => {
        extraCards.push({ label: `라이브 ${i + 1}일차 (${day.date.slice(5)})`, value: formatCurrency(day.netSales) });
      });
    }
  }

  return (
    <div className="flex flex-col gap-3 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{title}</p>
          {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
            aria-label="비교 행사 닫기"
          >
            ×
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {KPI_ROWS.map((row) => (
          <KpiCard
            key={row.label}
            label={row.label}
            value={getKpiValue(row, kpis, parsed)}
            status={getKpiStatus(row, kpis, parsed)}
            isInverted={row.isInverted}
          />
        ))}
        {extraCards.map((card) => (
          <KpiCard
            key={card.label}
            label={card.label}
            value={card.value}
            status="neutral"
          />
        ))}
      </div>
    </div>
  );
};

const EMPTY_PARSED: ParsedInfo = { hasSales: false, hasProducts: false };

const ComparisonSection: React.FC<ComparisonSectionProps> = ({
  currentKpis,
  currentParsed,
  currentContext,
  currentTimeSeries,
  compareKpis,
  compareParsed,
  compareTimeSeries,
  compareContexts,
  onClose,
  onUpload,
}) => {
  const hasCompare = compareKpis.some((k) => k !== null);

  if (!hasCompare) {
    return (
      <section className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-base font-bold text-gray-900 mb-4">행사 비교</h2>
        <div className="w-full">
          <ComparisonColumn
            title="이번 행사"
            kpis={currentKpis}
            parsed={currentParsed}
            context={currentContext}
            colTimeSeries={currentTimeSeries}
          />
          <div className="mt-6 flex flex-col items-center gap-3 py-6 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              이전 행사 파일을 업로드하면 비교 분석이 가능합니다
            </p>
            <button
              type="button"
              onClick={onUpload}
              className="px-4 py-2 text-sm font-medium text-white bg-blue rounded-lg hover:opacity-90 transition-opacity"
            >
              파일 업로드
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-base font-bold text-gray-900 mb-4">행사 비교</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 이번 행사 */}
        <ComparisonColumn
          title="이번 행사"
          kpis={currentKpis}
          parsed={currentParsed}
          context={currentContext}
          colTimeSeries={currentTimeSeries}
        />

        {/* 비교 행사 1 */}
        {compareKpis[0] !== undefined && (
          <ComparisonColumn
            title={compareContexts[0]?.eventName ?? '비교 행사 1'}
            subtitle={
              compareContexts[0]
                ? `${compareContexts[0].startDate} ~ ${compareContexts[0].endDate}`
                : undefined
            }
            kpis={compareKpis[0]}
            parsed={compareParsed[0] ?? EMPTY_PARSED}
            context={compareContexts[0] ?? null}
            colTimeSeries={compareTimeSeries[0] ?? []}
            onClose={() => onClose(0)}
          />
        )}

        {/* 비교 행사 2 */}
        {compareKpis[1] !== undefined && (
          <ComparisonColumn
            title={compareContexts[1]?.eventName ?? '비교 행사 2'}
            subtitle={
              compareContexts[1]
                ? `${compareContexts[1].startDate} ~ ${compareContexts[1].endDate}`
                : undefined
            }
            kpis={compareKpis[1]}
            parsed={compareParsed[1] ?? EMPTY_PARSED}
            context={compareContexts[1] ?? null}
            colTimeSeries={compareTimeSeries[1] ?? []}
            onClose={() => onClose(1)}
          />
        )}
      </div>
    </section>
  );
};

export default ComparisonSection;
