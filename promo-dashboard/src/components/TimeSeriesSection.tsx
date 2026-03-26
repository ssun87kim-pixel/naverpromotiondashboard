import React from 'react';
import { usePromotionStore } from '../stores/promotionStore';
import DailyLineChart from './DailyLineChart';
import HourlyBarChart from './HourlyBarChart';
import WeekdayTable from './WeekdayTable';
import { computeWeekdaySummary, computeHourly } from '../services/AnalyticsService';

const TimeSeriesSection: React.FC = () => {
  const timeSeries = usePromotionStore((s) => s.timeSeries);
  const hourlyData = usePromotionStore((s) => s.hourlyData);
  const drillDownDate = usePromotionStore((s) => s.drillDownDate);
  const context = usePromotionStore((s) => s.context);
  const parsedData = usePromotionStore((s) => s.parsedData);
  const setDrillDownDate = usePromotionStore((s) => s.setDrillDownDate);

  const liveDates = context?.liveDates ?? [];

  // 요일별 집계 (판매성과 파일 기반)
  const salesData = parsedData?.current?.sales;
  const weekdayData = salesData ? computeWeekdaySummary(salesData) : [];

  // 드릴다운 날짜가 있으면 해당 날짜의 시간대별 데이터 필터링
  const displayHourly = salesData && drillDownDate
    ? computeHourly(salesData, drillDownDate)
    : hourlyData;

  if (timeSeries.length === 0) {
    return null;
  }

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-6">
      <h2 className="text-base font-bold text-gray-900">시계열 분석</h2>

      {/* 요일별 집계 테이블 */}
      {weekdayData.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">요일별 집계</p>
          <WeekdayTable data={weekdayData} />
        </div>
      )}

      {/* 일별 추이 차트 */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">일별 매출 추이</p>
        <DailyLineChart
          data={timeSeries}
          liveDates={liveDates}
          onDayClick={(date) => setDrillDownDate(date)}
        />
      </div>

      {/* 시간대별 차트 */}
      {displayHourly.length > 0 && (
        <div>
          <HourlyBarChart
            data={displayHourly}
            selectedDate={drillDownDate ?? undefined}
            onReset={() => setDrillDownDate(null)}
          />
        </div>
      )}
    </section>
  );
};

export default TimeSeriesSection;
