import React from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ReferenceLine, ResponsiveContainer, Dot,
} from 'recharts';
import type { DailyTimeSeries } from '../types/index';
import { formatCurrency } from '../utils/format';

interface DailyLineChartProps {
  data: DailyTimeSeries[];
  liveDates: string[];
  onDayClick: (date: string) => void;
}

// X축 레이블: "03/11(화)" 형식
function formatXAxis(date: string, dayOfWeek: string): string {
  const parts = date.split('-'); // YYYY-MM-DD
  if (parts.length < 3) return date;
  return `${parts[1]}/${parts[2]}(${dayOfWeek})`;
}

// 별표 커스텀 dot (Peak)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PeakDot = (props: any) => {
  const { cx, cy, payload, index } = props;
  if (!payload?.isPeak || cx === undefined || cy === undefined) {
    return <Dot key={`peak-empty-${index}`} cx={cx} cy={cy} r={0} fill="transparent" />;
  }
  return (
    <text key={`peak-${index}`} x={cx} y={(cy ?? 0) - 10} textAnchor="middle" fontSize={16} fill="#282828">
      ★
    </text>
  );
};

const DailyLineChart: React.FC<DailyLineChartProps> = ({ data, liveDates, onDayClick }) => {
  const chartData = data.map((d) => ({
    ...d,
    xLabel: formatXAxis(d.date, d.dayOfWeek),
  }));

  const handleClick = (payload: { activePayload?: Array<{ payload: DailyTimeSeries }> }) => {
    if (payload?.activePayload?.[0]?.payload?.date) {
      onDayClick(payload.activePayload[0].payload.date);
    }
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
          onClick={handleClick}
          style={{ cursor: 'pointer' }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#EBEBEB" />
          <XAxis
            dataKey="xLabel"
            tick={{ fontSize: 11, fill: '#787878' }}
            tickLine={false}
          />
          <YAxis
            yAxisId="amount"
            tick={{ fontSize: 11, fill: '#787878' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => {
              if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}백만`;
              if (v >= 10_000) return `${(v / 10_000).toFixed(0)}만`;
              return v.toLocaleString('ko-KR');
            }}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              formatCurrency(value),
              name,
            ]}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />

          {/* 라이브 일자 수직 점선 */}
          {liveDates.map((ld) => {
            const entry = chartData.find((d) => d.date === ld);
            if (!entry) return null;
            return (
              <ReferenceLine
                key={ld}
                x={entry.xLabel}
                yAxisId="amount"
                stroke="#DC2626"
                strokeDasharray="4 4"
                label={{ value: 'LIVE', position: 'top', fill: '#DC2626', fontSize: 11 }}
              />
            );
          })}

          {/* 막대: 결제금액 */}
          <Bar
            yAxisId="amount"
            dataKey="paymentAmount"
            name="결제금액"
            fill="#515151"
            opacity={0.7}
            barSize={20}
          />
          {/* 막대: 환불금액 */}
          <Bar
            yAxisId="amount"
            dataKey="refundAmount"
            name="환불금액"
            fill="#F72B35"
            opacity={0.7}
            barSize={20}
          />
          {/* 선: 최종결제액 */}
          <Line
            yAxisId="amount"
            type="monotone"
            dataKey="netSales"
            name="최종결제액"
            stroke="#282828"
            strokeWidth={2}
            dot={(props: Record<string, unknown>) => {
              const { key: _key, ...rest } = props;
              return <PeakDot {...rest} />;
            }}
            activeDot={{ r: 5 }}
          />
          {/* 선: 쿠폰합계 */}
          <Line
            yAxisId="amount"
            type="monotone"
            dataKey="couponTotal"
            name="쿠폰합계"
            stroke="#DC2626"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DailyLineChart;
