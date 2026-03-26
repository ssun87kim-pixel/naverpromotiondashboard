# 단일 파일 분석 지원 - 설계

## 데이터 의존 관계

| 함수 | 판매성과 | 상품성과 |
|------|---------|---------|
| computeKpis | netSales, paymentAmount, refundAmount, achievementRate | paymentCount, couponTotal, refundRate |
| computeTimeSeries | 필수 | 불필요 |
| computeHourly | 필수 | 불필요 |
| computeWeekdaySummary | 필수 | 불필요 |
| computeProductStats | 불필요 | 필수 |

## 변경 계획

### 1. FileUploadPanel: 필수 조건 완화
- 기존: sales AND products 필수
- 변경: sales OR products 있으면 분석 가능

### 2. promotionStore.analyze(): 조건부 파싱/계산
- 판매성과 없으면 timeSeries, hourlyData 빈 배열
- 상품성과 없으면 productRows 빈 배열
- computeKpis를 두 경우 모두 처리하도록 수정 (없는 데이터는 0으로)

### 3. AnalyticsService.computeKpis(): 선택적 파라미터
- sales, products 모두 optional로 변경
- 없는 쪽 값은 0으로 처리

### 4. KpiCardGrid: 데이터 있는 카드만 렌더링
- 판매성과 없음 → 순매출, 달성률, 결제금액, 환불액 카드 숨김
- 상품성과 없음 → 결제수, 쿠폰합계, 환불률 카드 숨김

### 5. 대시보드 섹션: 조건부 렌더링
- TimeSeriesSection: timeSeries 비어있으면 이미 null 반환 (기존 로직 유지)
- ProductSection: productRows 비어있으면 null 반환 (기존 로직 확인)

## 변경 파일
- `src/components/FileUploadPanel.tsx`
- `src/stores/promotionStore.ts`
- `src/services/AnalyticsService.ts`
- `src/components/KpiCardGrid.tsx`
- `src/components/ProductSection.tsx` (필요시)
