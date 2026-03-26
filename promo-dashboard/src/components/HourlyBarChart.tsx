import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { HourlyData } from '../types/index';
import { formatCurrency } from '../utils/format';

interface HourlyBarChartProps {
  data: HourlyData[];
  selectedDate?: string;
  onReset: () => void;
}

// "YYYY-MM-DD" → "MM/DD" 형식
function formatDate(date: string): string {
  const parts = date.split('-');
  if (parts.length < 3) return date;
  return `${parts[1]}/${parts[2]}`;
}

const HourlyBarChart: React.FC<HourlyBarChartProps> = ({ data, selectedDate, onReset }) => {
  // 0~23시 전체 슬롯 보장
  const chartData = Array.from({ length: 24 }, (_, hour) => {
    const found = data.find((d) => d.hour === hour);
    return { hour, paymentAmount: found?.paymentAmount ?? 0 };
  });

  const title = selectedDate
    ? `${formatDate(selectedDate)} 시간대별 결제금액`
    : '전체 기간 시간대별 결제금액';

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-700">{title}</span>
        {selectedDate && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-blue border border-blue rounded px-2 py-1 hover:bg-blue hover:text-white transition-colors"
          >
            전체 기간 보기
          </button>
        )}
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#EBEBEB" />
          <XAxis
            dataKey="hour"
            tickFormatter={(h: number) => `${h}시`}
            tick={{ fontSize: 10, fill: '#787878' }}
            tickLine={false}
            interval={1}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#787878' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => {
              if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}백만`;
              if (v >= 10_000) return `${(v / 10_000).toFixed(0)}만`;
              return v.toLocaleString('ko-KR');
            }}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), '결제금액']}
            labelFormatter={(label: number) => `${label}시`}
          />
          <Bar dataKey="paymentAmount" name="결제금액" fill="#515151" barSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HourlyBarChart;
