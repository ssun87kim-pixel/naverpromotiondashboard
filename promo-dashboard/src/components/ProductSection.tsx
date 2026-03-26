import React, { useState } from 'react';
import { usePromotionStore } from '../stores/promotionStore';
import ProductTable from './ProductTable';
import ProductPieCharts from './ProductPieCharts';
import type { ProductRow } from '../types/index';

interface ProductBlockProps {
  label: string;
  rows: ProductRow[];
}

const ProductBlock: React.FC<ProductBlockProps> = ({ label, rows }) => {
  const [sortKey, setSortKey] = useState<'qty' | 'amount' | 'refundRate'>('qty');
  const [refundSortKey, setRefundSortKey] = useState<'qty' | 'amount' | 'refundRate'>('refundRate');
  const [drillDown, setDrillDown] = useState<string | null>(null);

  const visibleRows = drillDown
    ? rows.filter((r) => r.division === drillDown)
    : rows;

  const highRefundRows = rows.filter((r) => r.isHighRefund);

  return (
    <div className="flex flex-col gap-4 min-w-0">
      <p className="text-sm font-semibold text-gray-800 border-l-4 border-blue pl-2">{label}</p>

      <ProductPieCharts
        rows={rows}
        drillDownCategory={drillDown}
        onCategoryClick={(d) => setDrillDown(d)}
        onBack={() => setDrillDown(null)}
      />

      <ProductTable
        rows={visibleRows}
        sortKey={sortKey}
        onSortChange={setSortKey}
        onCategoryClick={(d) => setDrillDown(d)}
        drillDownCategory={drillDown}
      />

      {highRefundRows.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-gray-900">환불 참고 상품</h3>
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white"
              style={{ backgroundColor: '#FF5948' }}
            >
              {highRefundRows.length}건
            </span>
            <span className="text-xs text-gray-500">
              평균 환불율 초과 상품
            </span>
          </div>
          <ProductTable
            rows={highRefundRows}
            sortKey={refundSortKey}
            onSortChange={setRefundSortKey}
            onCategoryClick={() => {}}
            drillDownCategory={null}
          />
        </div>
      )}
    </div>
  );
};

const ProductSection: React.FC = () => {
  const productRows = usePromotionStore((s) => s.productRows);
  const compareProductRows = usePromotionStore((s) => s.compareProductRows);
  const compareContexts = usePromotionStore((s) => s.compareContexts);

  const hasCompare = compareProductRows.some((pr) => pr.length > 0);

  if (productRows.length === 0 && !hasCompare) return null;

  // 비교 행사 없으면 기존과 동일 (전체 너비)
  if (!hasCompare) {
    return (
      <section className="flex flex-col gap-6">
        <h2 className="text-base font-semibold text-gray-900">상품별 성과 분석</h2>
        {productRows.length > 0 && <ProductBlock label="이번 행사" rows={productRows} />}
      </section>
    );
  }

  // 비교 행사 있으면 좌우 나란히
  const compareBlocks = compareProductRows
    .map((rows, i) => ({ rows, label: compareContexts[i]?.eventName || `비교 행사 ${i + 1}` }))
    .filter((b) => b.rows.length > 0);

  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-base font-semibold text-gray-900">상품별 성과 분석</h2>
      <div className={`grid gap-6 ${compareBlocks.length === 1 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {productRows.length > 0 && <ProductBlock label="이번 행사" rows={productRows} />}
        {compareBlocks.map((b) => (
          <ProductBlock key={b.label} label={b.label} rows={b.rows} />
        ))}
      </div>
    </section>
  );
};

export default ProductSection;
