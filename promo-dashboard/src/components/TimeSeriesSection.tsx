import React, { useState } from 'react';
import { usePromotionStore } from '../stores/promotionStore';
import DailyLineChart from './DailyLineChart';
import HourlyBarChart from './HourlyBarChart';
import WeekdayTable from './WeekdayTable';
import EventTabs from './EventTabs';
import { computeWeekdaySummary, computeHourly } from '../services/AnalyticsService';

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

  const [activeTab, setActiveTab] = useState(0);

  // 탭 라벨 구성
  const tabLabels = ['이번 행사'];
  const hasCompare = compareTimeSeries.some((ts) => ts.length > 0);
  if (hasCompare) {
    compareContexts.forEach((ctx, i) => {
      if (compareTimeSeries[i]?.length > 0) {
        tabLabels.push(ctx?.eventName || `비교 행사 ${i + 1}`);
      }
    });
  }

  // 활성 탭에 따른 데이터 선택
  const isCurrentTab = activeTab === 0;
  const compareIndex = activeTab - 1;

  const activeTimeSeries = isCurrentTab ? timeSeries : (compareTimeSeries[compareIndex] ?? []);
  const activeHourly = isCurrentTab ? hourlyData : (compareHourlyData[compareIndex] ?? []);
  const activeContext = isCurrentTab ? context : (compareContexts[compareIndex] ?? null);
  const activeSalesData = isCurrentTab
    ? parsedData?.current?.sales
    : parsedData?.compare[compareIndex]?.sales;

  const liveDates = activeContext?.liveDates ?? [];
  const weekdayData = activeSalesData ? computeWeekdaySummary(activeSalesData) : [];
  const displayHourly = activeSalesData && drillDownDate
    ? computeHourly(activeSalesData, drillDownDate)
    : activeHourly;

  if (timeSeries.length === 0 && !hasCompare) {
    return null;
  }

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-6">
      <h2 className="text-base font-bold text-gray-900">시계열 분석</h2>

      <EventTabs labels={tabLabels} activeIndex={activeTab} onChange={setActiveTab} />

      {activeTimeSeries.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">판매성과 데이터가 없습니다</p>
      ) : (
        <>
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
              data={activeTimeSeries}
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
        </>
      )}
    </section>
  );
};

export default TimeSeriesSection;
