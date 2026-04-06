import React, { useState } from 'react';
import type { ProductRow } from '../types/index';
import { formatNumber, formatCurrency, formatRate } from '../utils/format';
import { usePromotionStore } from '../stores/promotionStore';

interface ProductTableProps {
  rows: ProductRow[];
  sortKey: 'qty' | 'amount' | 'refundRate';
  onSortChange: (key: 'qty' | 'amount' | 'refundRate') => void;
  onCategoryClick?: (division: string) => void;
  drillDownCategory?: string | null;
  isRefundView?: boolean;
}

const SORT_LABELS: Record<'qty' | 'amount' | 'refundRate', string> = {
  qty: '판매수량순',
  amount: '결제금액순',
  refundRate: '환불율순',
};

function sortRows(rows: ProductRow[], key: 'qty' | 'amount' | 'refundRate', isRefundView = false): ProductRow[] {
  return [...rows].sort((a, b) => {
    if (key === 'qty') return isRefundView ? b.refundQty - a.refundQty : b.qty - a.qty;
    if (key === 'amount') return isRefundView ? b.refundAmount - a.refundAmount : b.netAmount - a.netAmount;
    return b.refundRate - a.refundRate;
  });
}

// 구분별로 집계
function groupByDivision(rows: ProductRow[]): Map<string, ProductRow[]> {
  const map = new Map<string, ProductRow[]>();
  for (const row of rows) {
    const key = row.division;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(row);
  }
  return map;
}

// 대분류별로 집계
function groupByLargeCat(rows: ProductRow[]): Map<string, ProductRow[]> {
  const map = new Map<string, ProductRow[]>();
  for (const row of rows) {
    const key = row.largeCat;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(row);
  }
  return map;
}

// 집계 행 계산 (비중은 전체 합계 기준으로 동적 계산)
function sumRows(rows: ProductRow[], totalQty: number, totalAmount: number): { qty: number; refundQty: number; qtyShare: number; netAmount: number; refundAmount: number; amountShare: number; refundRate: number } {
  const qty = rows.reduce((s, r) => s + r.qty, 0);
  const refundQty = rows.reduce((s, r) => s + r.refundQty, 0);
  const netAmount = rows.reduce((s, r) => s + r.netAmount, 0);
  const refundAmount = rows.reduce((s, r) => s + r.refundAmount, 0);
  const qtyShare = totalQty > 0 ? (qty / totalQty) * 100 : 0;
  const amountShare = totalAmount > 0 ? (netAmount / totalAmount) * 100 : 0;
  const avgRefundRate = rows.length > 0 ? rows.reduce((s, r) => s + r.refundRate, 0) / rows.length : 0;
  return { qty, refundQty, qtyShare, netAmount, refundAmount, amountShare, refundRate: avgRefundRate };
}

const ProductTable: React.FC<ProductTableProps> = ({
  rows,
  sortKey,
  onSortChange,
  isRefundView = false,
}) => {
  const pdfCaptureMode = usePromotionStore((s) => s.pdfCaptureMode);
  const [openDivisions, setOpenDivisions] = useState<Set<string>>(new Set());
  const [openLargeCats, setOpenLargeCats] = useState<Set<string>>(new Set());

  // PDF 캡처 중이면 모두 접힌 상태
  const effectiveOpenDivisions = pdfCaptureMode ? new Set<string>() : openDivisions;
  const effectiveOpenLargeCats = pdfCaptureMode ? new Set<string>() : openLargeCats;

  const toggleDivision = (div: string) => {
    setOpenDivisions((prev) => {
      const next = new Set(prev);
      if (next.has(div)) next.delete(div);
      else next.add(div);
      return next;
    });
  };

  const toggleLargeCat = (key: string) => {
    setOpenLargeCats((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // 현재 표시 rows 기준으로 전체 합계 계산 (드릴다운 시 해당 구분이 100% 기준)
  const totalQty = rows.reduce((s, r) => s + r.qty, 0);
  const totalAmount = rows.reduce((s, r) => s + r.netAmount, 0);

  const divisionMap = groupByDivision(rows);

  // sortKey 기준으로 구분값 정렬
  const sortedDivisions = Array.from(divisionMap.keys()).sort((a, b) => {
    const aRows = divisionMap.get(a)!;
    const bRows = divisionMap.get(b)!;
    if (sortKey === 'qty') {
      const qtyField = isRefundView ? 'refundQty' : 'qty';
      return bRows.reduce((s, r) => s + r[qtyField], 0) - aRows.reduce((s, r) => s + r[qtyField], 0);
    }
    if (sortKey === 'amount') {
      const amtField = isRefundView ? 'refundAmount' : 'netAmount';
      return bRows.reduce((s, r) => s + r[amtField], 0) - aRows.reduce((s, r) => s + r[amtField], 0);
    }
    const aAvg = aRows.length > 0 ? aRows.reduce((s, r) => s + r.refundRate, 0) / aRows.length : 0;
    const bAvg = bRows.length > 0 ? bRows.reduce((s, r) => s + r.refundRate, 0) / bRows.length : 0;
    return bAvg - aAvg;
  });

  const thClass = 'text-right px-3 py-2 font-medium text-gray-700 border-b border-gray-200 whitespace-nowrap';

  return (
    <div className="flex flex-col gap-2">
      {/* 정렬 버튼 */}
      <div className="flex gap-2">
        {(['qty', 'amount', 'refundRate'] as const)
          .filter((key) => isRefundView || key !== 'refundRate')
          .map((key) => (
          <button
            key={key}
            onClick={() => onSortChange(key)}
            className={`px-3 py-1 text-xs rounded border transition-colors ${
              sortKey === key
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
            }`}
          >
            {isRefundView && key === 'qty' ? '환불수량순' : isRefundView && key === 'amount' ? '환불금액순' : SORT_LABELS[key]}
          </button>
        ))}
      </div>

      {/* 테이블 */}
      <div className="overflow-y-auto border border-gray-200 rounded-lg" style={{ maxHeight: 600 }}>
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 bg-gray-50 z-10">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-gray-700 border-b border-gray-200 whitespace-nowrap">구분 / 대분류 / 상품명</th>
              <th className={thClass}>{isRefundView ? '환불수량' : '판매수량'}</th>
              <th className={thClass}>비중(%)</th>
              <th className={thClass}>{isRefundView ? '환불금액' : '결제금액'}</th>
              <th className={thClass}>비중(%)</th>
              {isRefundView && <th className={thClass}>환불율</th>}
            </tr>
          </thead>
          <tbody>
            {sortedDivisions.length === 0 ? (
              <tr>
                <td colSpan={isRefundView ? 6 : 5} className="text-center py-8 text-gray-400">데이터가 없습니다</td>
              </tr>
            ) : (
              sortedDivisions.map((division) => {
                const divRows = divisionMap.get(division)!;
                const divSum = sumRows(divRows, totalQty, totalAmount);
                const isOpen = effectiveOpenDivisions.has(division);
                const largeCatMap = groupByLargeCat(divRows);
                const sortedLargeCats = Array.from(largeCatMap.keys()).sort((a, b) => {
                  const aRows = largeCatMap.get(a)!;
                  const bRows = largeCatMap.get(b)!;
                  if (sortKey === 'qty') {
                    const qtyField = isRefundView ? 'refundQty' : 'qty';
                    return bRows.reduce((s, r) => s + r[qtyField], 0) - aRows.reduce((s, r) => s + r[qtyField], 0);
                  }
                  if (sortKey === 'amount') {
                    const amtField = isRefundView ? 'refundAmount' : 'netAmount';
                    return bRows.reduce((s, r) => s + r[amtField], 0) - aRows.reduce((s, r) => s + r[amtField], 0);
                  }
                  const aAvg = aRows.length > 0 ? aRows.reduce((s, r) => s + r.refundRate, 0) / aRows.length : 0;
                  const bAvg = bRows.length > 0 ? bRows.reduce((s, r) => s + r.refundRate, 0) / bRows.length : 0;
                  return bAvg - aAvg;
                });

                return (
                  <React.Fragment key={division}>
                    {/* 구분 행 */}
                    <tr
                      className="bg-gray-100 cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => toggleDivision(division)}
                    >
                      <td className="px-3 py-2 font-semibold text-gray-900">
                        <span className="mr-2 text-gray-500">{isOpen ? '▼' : '▶'}</span>
                        {division}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums font-medium">{formatNumber(isRefundView ? divSum.refundQty : divSum.qty)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-gray-600">{divSum.qtyShare.toFixed(1)}%</td>
                      <td className="px-3 py-2 text-right tabular-nums font-medium">{formatCurrency(isRefundView ? divSum.refundAmount : divSum.netAmount)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-gray-600">{divSum.amountShare.toFixed(1)}%</td>
                      {isRefundView && <td className="px-3 py-2 text-right tabular-nums">{formatRate(divSum.refundRate)}</td>}
                    </tr>

                    {/* 대분류 행들 */}
                    {isOpen && sortedLargeCats.map((largeCat) => {
                      const lcRows = largeCatMap.get(largeCat)!;
                      const lcSum = sumRows(lcRows, totalQty, totalAmount);
                      const lcKey = `${division}__${largeCat}`;
                      const isLcOpen = effectiveOpenLargeCats.has(lcKey);
                      const sortedProducts = sortRows(lcRows, sortKey, isRefundView);

                      return (
                        <React.Fragment key={lcKey}>
                          {/* 대분류 행 */}
                          <tr
                            className="bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => toggleLargeCat(lcKey)}
                          >
                            <td className="px-3 py-2 text-gray-800 pl-8">
                              <span className="mr-2 text-gray-400">{isLcOpen ? '▼' : '▶'}</span>
                              {largeCat}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-gray-800">{formatNumber(isRefundView ? lcSum.refundQty : lcSum.qty)}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-gray-600">{lcSum.qtyShare.toFixed(1)}%</td>
                            <td className="px-3 py-2 text-right tabular-nums text-gray-800">{formatCurrency(isRefundView ? lcSum.refundAmount : lcSum.netAmount)}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-gray-600">{lcSum.amountShare.toFixed(1)}%</td>
                            {isRefundView && <td className="px-3 py-2 text-right tabular-nums">{formatRate(lcSum.refundRate)}</td>}
                          </tr>

                          {/* 상품 행들 */}
                          {isLcOpen && sortedProducts.map((row, idx) => (
                            <tr
                              key={`${row.productId}-${idx}`}
                              className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                            >
                              <td className="px-3 py-2 text-gray-700 pl-14">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs">{row.productName}</span>
                                  {row.isHighRefund && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium text-white" style={{ backgroundColor: '#FF5948' }}>
                                      환불 참고
                                    </span>
                                  )}
                                  {row.isUnmatched && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-400 text-white">
                                      미매칭
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2 text-right text-gray-700 tabular-nums text-xs">{formatNumber(isRefundView ? row.refundQty : row.qty)}</td>
                              <td className="px-3 py-2 text-right text-gray-500 tabular-nums text-xs">{(totalQty > 0 ? (row.qty / totalQty) * 100 : 0).toFixed(1)}%</td>
                              <td className="px-3 py-2 text-right text-gray-700 tabular-nums text-xs">{formatCurrency(isRefundView ? row.refundAmount : row.netAmount)}</td>
                              <td className="px-3 py-2 text-right text-gray-500 tabular-nums text-xs">{(totalAmount > 0 ? (row.netAmount / totalAmount) * 100 : 0).toFixed(1)}%</td>
                              {isRefundView && (
                                <td className="px-3 py-2 text-right tabular-nums text-xs">
                                  <span style={row.isHighRefund ? { color: '#FF5948', fontWeight: 600 } : { color: '#515151' }}>
                                    {formatRate(row.refundRate)}
                                  </span>
                                </td>
                              )}
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductTable;
