import React from 'react';
import { usePromotionStore } from '../stores/promotionStore';
import DailyLineChart from './DailyLineChart';
import HourlyBarChart from './HourlyBarChart';
import WeekdayTable from './WeekdayTable';
import { computeWeekdaySummary, computeHourly } from '../services/AnalyticsService';
import type { SalesPerformanceData, DailyTimeSeries, HourlyData, PromotionRecord } from '../types/index';

interface EventBlockProps {
  label: string;
  timeSeries: DailyTimeSeries[];
  hourlyData: HourlyData[];
  salesData?: SalesPerformanceData;
  context: PromotionRecord | null;
  drillDownDate: string | null;
  onDrillDown: (date: string) => void;
  onResetDrillDown: () => void;
}

const EventBlock: React.FC<EventBlockProps> = ({
  label,
  timeSeries,
  hourlyData,
  salesData,
  context,
  drillDownDate,
  onDrillDown,
  onResetDrillDown,
}) => {
  const liveDates = context?.liveDates ?? [];
  const weekdayData = salesData ? computeWeekdaySummary(salesData) : [];
  const displayHourly = salesData && drillDownDate
    ? computeHourly(salesData, drillDownDate)
    : hourlyData;

  const periodLabel = context?.startDate && context?.endDate
    ? `${context.startDate} ~ ${context.endDate}`
    : '';

  if (timeSeries.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex items-baseline gap-2 border-l-4 border-blue pl-2">
        <span className="text-sm font-semibold text-gray-800">{label}</span>
        {periodLabel && <span className="text-xs text-gray-500">{periodLabel}</span>}
      </div>

      {weekdayData.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">요일별 집계</p>
          <WeekdayTable data={weekdayData} />
        </div>
      )}

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">일별 매출 추이</p>
        <DailyLineChart
          data={timeSeries}
          liveDates={liveDates}
          onDayClick={onDrillDown}
        />
      </div>

      {displayHourly.length > 0 && (
        <div>
          <HourlyBarChart
            data={displayHourly}
            selectedDate={drillDownDate ?? undefined}
            onReset={onResetDrillDown}
          />
        </div>
      )}
    </div>
  );
};

const TimeSeriesSection: React.FC = () => {
  const timeSeries = usePromotionStore((s) => s.timeSeries);
  const hourlyData = usePromotionStore((s) => s.hourlyData);
  const compareTimeSeries = usePromotionStore((s) => s.compareTimeSeries);
  const compareHourlyData = usePromotionStore((s) => s.compareHourlyData);
  const drillDownDate = usePromotionStore((s) => s.drillDownDate);
  const context = usePromotionStore((s) => s.context);
  const compareContexts = usePromotionStore((s) => s.compareContexts);
  const parsedData = usePromotionStore((s) => s.parsedData);
  const setDrillDownDate = usePromotionStore((s) => s.setDrillDownDate);

  const hasCompare = compareTimeSeries.some((ts) => ts.length > 0);

  if (timeSeries.length === 0 && !hasCompare) {
    return null;
  }

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-6">
      <h2 className="text-base font-bold text-gray-900">시계열 분석</h2>

      {/* 이번 행사 */}
      <EventBlock
        label={context?.eventName || '이번 행사'}
        timeSeries={timeSeries}
        hourlyData={hourlyData}
        salesData={parsedData?.current?.sales}
        context={context}
        drillDownDate={drillDownDate}
        onDrillDown={setDrillDownDate}
        onResetDrillDown={() => setDrillDownDate(null)}
      />

      {/* 비교 행사들 */}
      {hasCompare && compareTimeSeries.map((cts, i) => {
        if (cts.length === 0) return null;
        return (
          <React.Fragment key={i}>
            <hr className="border-gray-200" />
            <EventBlock
              label={compareContexts[i]?.eventName || `비교 행사 ${i + 1}`}
              timeSeries={cts}
              hourlyData={compareHourlyData[i] ?? []}
              salesData={parsedData?.compare[i]?.sales}
              context={compareContexts[i] ?? null}
              drillDownDate={drillDownDate}
              onDrillDown={setDrillDownDate}
              onResetDrillDown={() => setDrillDownDate(null)}
            />
          </React.Fragment>
        );
      })}
    </section>
  );
};

export default TimeSeriesSection;
