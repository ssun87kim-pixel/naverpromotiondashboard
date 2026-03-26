import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { ProductRow } from '../types/index';

interface ProductPieChartsProps {
  rows: ProductRow[];
  drillDownCategory: string | null;
  onCategoryClick: (division: string) => void;
  onBack: () => void;
}

// DESKER 차트 팔레트
const COLORS = ['#282828', '#515151', '#336DFF', '#B3B3B3', '#00B441', '#F72B35'];

interface PieEntry {
  name: string;
  value: number;
}

function aggregateByDivision(rows: ProductRow[]): { qty: PieEntry[]; amount: PieEntry[] } {
  const qtyMap = new Map<string, number>();
  const amountMap = new Map<string, number>();
  for (const row of rows) {
    qtyMap.set(row.division, (qtyMap.get(row.division) ?? 0) + row.qty);
    amountMap.set(row.division, (amountMap.get(row.division) ?? 0) + row.netAmount);
  }
  return {
    qty: Array.from(qtyMap.entries()).map(([name, value]) => ({ name, value })),
    amount: Array.from(amountMap.entries()).map(([name, value]) => ({ name, value })),
  };
}

function aggregateByLargeCat(rows: ProductRow[], division: string): { qty: PieEntry[]; amount: PieEntry[] } {
  const filtered = rows.filter((r) => r.division === division);
  const qtyMap = new Map<string, number>();
  const amountMap = new Map<string, number>();
  for (const row of filtered) {
    qtyMap.set(row.largeCat, (qtyMap.get(row.largeCat) ?? 0) + row.qty);
    amountMap.set(row.largeCat, (amountMap.get(row.largeCat) ?? 0) + row.netAmount);
  }
  return {
    qty: Array.from(qtyMap.entries()).map(([name, value]) => ({ name, value })),
    amount: Array.from(amountMap.entries()).map(([name, value]) => ({ name, value })),
  };
}

// 상위 4개 레이블을 파이 조각 위에 직접 표시하는 커스텀 레이블 (labelLine 연결)
const renderCustomLabel = (data: PieEntry[]) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  const top4 = [...data].sort((a, b) => b.value - a.value).slice(0, 4).map(d => d.name);

  return (props: {
    cx?: number; midAngle?: number;
    outerRadius?: number;
    name?: string; value?: number;
    x?: number; y?: number;
  }) => {
    const { cx = 0, name = '', value = 0, x = 0, y = 0 } = props;
    if (!top4.includes(name)) return null;
    const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
    const shortName = name.length > 7 ? name.slice(0, 7) + '…' : name;
    const anchor = x > cx ? 'start' : 'end';
    return (
      <text
        x={x}
        y={y}
        fill="#282828"
        textAnchor={anchor}
        dominantBaseline="central"
        fontSize={11}
        fontWeight={500}
      >
        {`${shortName} ${pct}%`}
      </text>
    );
  };
};

interface SinglePieProps {
  title: string;
  data: PieEntry[];
  onSliceClick?: (name: string) => void;
}

const SinglePie: React.FC<SinglePieProps> = ({ title, data, onSliceClick }) => {
  const customLabel = renderCustomLabel(data);
  return (
    <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
      <span className="text-sm font-medium text-gray-700">{title}</span>
      <ResponsiveContainer width="100%" height={340}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={85}
            dataKey="value"
            label={customLabel}
            labelLine={{ stroke: '#B3B3B3', strokeWidth: 1 }}
            onClick={onSliceClick ? (entry) => onSliceClick(entry.name as string) : undefined}
            style={onSliceClick ? { cursor: 'pointer' } : undefined}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => [value.toLocaleString(), '']} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

const ProductPieCharts: React.FC<ProductPieChartsProps> = ({
  rows,
  drillDownCategory,
  onCategoryClick,
  onBack,
}) => {
  const { qty, amount } = drillDownCategory
    ? aggregateByLargeCat(rows, drillDownCategory)
    : aggregateByDivision(rows);

  const handleSliceClick = drillDownCategory ? undefined : onCategoryClick;

  return (
    <div className="flex flex-col gap-3">
      {drillDownCategory && (
        <button
          onClick={onBack}
          className="self-start flex items-center gap-1 text-xs text-blue hover:underline"
        >
          ← 전체 구분으로 돌아가기
        </button>
      )}

      <div className="flex flex-row gap-4 w-full">
        <SinglePie
          title="판매수량 비중"
          data={qty}
          onSliceClick={handleSliceClick}
        />
        <SinglePie
          title="결제금액 비중"
          data={amount}
          onSliceClick={handleSliceClick}
        />
      </div>

      {!drillDownCategory && qty.length > 0 && (
        <p className="text-xs text-gray-400 text-center">
          구분을 클릭하면 대분류별로 드릴다운됩니다
        </p>
      )}
    </div>
  );
};

export default ProductPieCharts;
