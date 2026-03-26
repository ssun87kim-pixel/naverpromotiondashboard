import React, { useState } from 'react';
import { usePromotionStore } from '../stores/promotionStore';
import ProductTable from './ProductTable';
import ProductPieCharts from './ProductPieCharts';

const ProductSection: React.FC = () => {
  const productRows = usePromotionStore((s) => s.productRows);
  const drillDownCategory = usePromotionStore((s) => s.drillDownCategory);
  const setDrillDownCategory = usePromotionStore((s) => s.setDrillDownCategory);

  const [sortKey, setSortKey] = useState<'qty' | 'amount' | 'refundRate'>('qty');
  const [refundSortKey, setRefundSortKey] = useState<'qty' | 'amount' | 'refundRate'>('refundRate');

  if (productRows.length === 0) return null;

  const handleCategoryClick = (division: string) => setDrillDownCategory(division);
  const handleBack = () => setDrillDownCategory(null);

  const visibleRows = drillDownCategory
    ? productRows.filter((r) => r.division === drillDownCategory)
    : productRows;

  // 환불 참고 상품 (평균 환불율 초과)
  const highRefundRows = productRows.filter((r) => r.isHighRefund);

  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-base font-semibold text-gray-900">상품별 성과 분석</h2>

      {/* 파이 차트 */}
      <div className="w-full">
        <ProductPieCharts
          rows={productRows}
          drillDownCategory={drillDownCategory}
          onCategoryClick={handleCategoryClick}
          onBack={handleBack}
        />
      </div>

      {/* 전체 상품 테이블 */}
      <div className="w-full">
        <ProductTable
          rows={visibleRows}
          sortKey={sortKey}
          onSortChange={setSortKey}
          onCategoryClick={handleCategoryClick}
          drillDownCategory={drillDownCategory}
        />
      </div>

      {/* 환불 참고 상품 섹션 */}
      {highRefundRows.length > 0 && (
        <div className="w-full">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-gray-900">환불 참고 상품</h3>
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white"
              style={{ backgroundColor: '#FF5948' }}
            >
              {highRefundRows.length}건
            </span>
            <span className="text-xs text-gray-500">
              평균 환불율을 초과한 상품으로, 다음 행사 기획 시 재고 및 품질 점검이 필요한 상품입니다.
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
    </section>
  );
};

export default ProductSection;
