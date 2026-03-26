import React, { useState } from 'react';
import { usePromotionStore } from '../stores/promotionStore';
import ProductTable from './ProductTable';
import ProductPieCharts from './ProductPieCharts';
import EventTabs from './EventTabs';

const ProductSection: React.FC = () => {
  const productRows = usePromotionStore((s) => s.productRows);
  const compareProductRows = usePromotionStore((s) => s.compareProductRows);
  const compareContexts = usePromotionStore((s) => s.compareContexts);
  const drillDownCategory = usePromotionStore((s) => s.drillDownCategory);
  const setDrillDownCategory = usePromotionStore((s) => s.setDrillDownCategory);

  const [activeTab, setActiveTab] = useState(0);
  const [sortKey, setSortKey] = useState<'qty' | 'amount' | 'refundRate'>('qty');
  const [refundSortKey, setRefundSortKey] = useState<'qty' | 'amount' | 'refundRate'>('refundRate');

  // 탭 라벨 구성
  const tabLabels = ['이번 행사'];
  const hasCompare = compareProductRows.some((pr) => pr.length > 0);
  if (hasCompare) {
    compareContexts.forEach((ctx, i) => {
      if (compareProductRows[i]?.length > 0) {
        tabLabels.push(ctx?.eventName || `비교 행사 ${i + 1}`);
      }
    });
  }

  // 활성 탭에 따른 데이터 선택
  const isCurrentTab = activeTab === 0;
  const compareIndex = activeTab - 1;
  const activeRows = isCurrentTab ? productRows : (compareProductRows[compareIndex] ?? []);

  if (productRows.length === 0 && !hasCompare) return null;

  const handleCategoryClick = (division: string) => setDrillDownCategory(division);
  const handleBack = () => setDrillDownCategory(null);

  const visibleRows = drillDownCategory
    ? activeRows.filter((r) => r.division === drillDownCategory)
    : activeRows;

  const highRefundRows = activeRows.filter((r) => r.isHighRefund);

  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-base font-semibold text-gray-900">상품별 성과 분석</h2>

      <EventTabs labels={tabLabels} activeIndex={activeTab} onChange={(i) => { setActiveTab(i); setDrillDownCategory(null); }} />

      {activeRows.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">상품성과 데이터가 없습니다</p>
      ) : (
        <>
          {/* 파이 차트 */}
          <div className="w-full">
            <ProductPieCharts
              rows={activeRows}
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
        </>
      )}
    </section>
  );
};

export default ProductSection;
