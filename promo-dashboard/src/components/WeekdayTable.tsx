import React from 'react';
import type { WeekdayRow } from '../types/index';
import { formatCurrency } from '../utils/format';

interface Props {
  data: WeekdayRow[];
}

const WeekdayTable: React.FC<Props> = ({ data }) => {
  if (data.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left px-3 py-2 font-medium text-gray-700 border-b border-gray-200">요일</th>
            <th className="text-right px-3 py-2 font-medium text-gray-700 border-b border-gray-200">최종결제액</th>
            <th className="text-right px-3 py-2 font-medium text-gray-700 border-b border-gray-200">결제금액</th>
            <th className="text-right px-3 py-2 font-medium text-gray-700 border-b border-gray-200">환불금액</th>
            <th className="text-right px-3 py-2 font-medium text-gray-700 border-b border-gray-200">쿠폰합계</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={row.dayOfWeek} className={idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
              <td className="px-3 py-2 font-medium text-gray-900">{row.dayOfWeek}</td>
              <td className="px-3 py-2 text-right text-gray-900 tabular-nums">{formatCurrency(row.netSales)}</td>
              <td className="px-3 py-2 text-right text-gray-700 tabular-nums">{formatCurrency(row.paymentAmount)}</td>
              <td className="px-3 py-2 text-right text-red tabular-nums">{formatCurrency(row.refundAmount)}</td>
              <td className="px-3 py-2 text-right text-blue tabular-nums">{formatCurrency(row.couponTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default WeekdayTable;
