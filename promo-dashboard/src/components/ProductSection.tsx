import React, { useState } from 'react';
import { usePromotionStore } from '../stores/promotionStore';

const PdfCaptureNotice: React.FC = () => {
  const pdfCaptureMode = usePromotionStore((s) => s.pdfCaptureMode);
  if (!pdfCaptureMode) return null;
  return (
    <p className="text-sm text-gray-400 text-left mt-1 pb-4">
      * PDF에서는 상품 성과가 구분 단위로 표시됩니다. 상세 내역은 엑셀 다운로드를 이용해주세요.
    </p>
  );
};
import ProductTable from './ProductTable';
import ProductPieCharts from './ProductPieCharts';
import type { ProductRow } from '../types/index';

interface ProductBlockProps {
  label: string;
  period?: string;
  rows: ProductRow[];
}

const ProductBlock: React.FC<ProductBlockProps> = ({ label, period, rows }) => {
  const [sortKey, setSortKey] = useState<'qty' | 'amount' | 'refundRate'>('qty');
  const [refundSortKey, setRefundSortKey] = useState<'qty' | 'amount' | 'refundRate'>('refundRate');
  const [drillDown, setDrillDown] = useState<string | null>(null);

  const visibleRows = drillDown
    ? rows.filter((r) => r.division === drillDown)
    : rows;

  const highRefundRows = rows.filter((r) => r.isHighRefund);

  return (
    <div className="flex flex-col gap-4 min-w-0 bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-baseline gap-2 border-l-4 border-blue pl-2">
        <span className="text-sm font-semibold text-gray-800">{label}</span>
        {period && <span className="text-xs text-gray-500">{period}</span>}
      </div>

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
            isRefundView
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
  const context = usePromotionStore((s) => s.context);

  const hasCompare = compareProductRows.some((pr) => pr.length > 0);
  const currentLabel = context?.eventName || '이번 행사';
  const currentPeriod = context?.startDate && context?.endDate
    ? `${context.startDate} ~ ${context.endDate}` : '';

  if (productRows.length === 0 && !hasCompare) return null;

  // 비교 행사 없으면 기존과 동일 (전체 너비)
  if (!hasCompare) {
    return (
      <section className="flex flex-col gap-6">
        <h2 className="text-base font-semibold text-gray-900">상품별 성과 분석</h2>
        {productRows.length > 0 && <ProductBlock label={currentLabel} period={currentPeriod} rows={productRows} />}
        <PdfCaptureNotice />
      </section>
    );
  }

  // 비교 행사 있으면 좌우 나란히
  const compareBlocks = compareProductRows
    .map((rows, i) => ({
      rows,
      label: compareContexts[i]?.eventName || `비교 행사 ${i + 1}`,
      period: compareContexts[i]?.startDate && compareContexts[i]?.endDate
        ? `${compareContexts[i].startDate} ~ ${compareContexts[i].endDate}` : '',
    }))
    .filter((b) => b.rows.length > 0);

  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-base font-semibold text-gray-900">상품별 성과 분석</h2>
      <div className={`grid gap-6 ${compareBlocks.length === 1 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {productRows.length > 0 && <ProductBlock label={currentLabel} period={currentPeriod} rows={productRows} />}
        {compareBlocks.map((b) => (
          <ProductBlock key={b.label} label={b.label} period={b.period} rows={b.rows} />
        ))}
      </div>
      <PdfCaptureNotice />
    </section>
  );
};

export default ProductSection;
