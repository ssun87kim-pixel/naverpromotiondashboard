# 비교 행사 분석 구현 - 설계

## 변경 계획

### 1. promotionStore: compareKpis 상태 추가 + analyzeCompare 로직
- `compareKpis: (KpiSummary | null)[]` 상태 추가
- `analyze()` 내에서 compareFiles도 함께 파싱/계산
- 비교 행사별로 computeKpis 호출 (단일 분석과 동일 로직)
- `removeCompare(index)` 액션 추가 — 비교 데이터 제거

### 2. CompareEventUpload: 필수 조건 완화
- 판매성과/상품성과 required 제거 (하나만 있어도 됨)

### 3. App.tsx
- 하드코딩된 `compareKpis = [null, null]` 제거 → store에서 가져오기
- `handleCloseCompare` 구현 → store.removeCompare 호출

### 4. ComparisonSection: 부분 데이터 KPI 표시
- KPI 값이 0인 항목과 데이터 없는 항목을 구분
- 파일 없는 쪽 KPI 필드는 null로 처리 → `-` 표시

## 변경 파일
- `src/stores/promotionStore.ts`
- `src/components/CompareEventUpload.tsx`
- `src/App.tsx`
- `src/components/ComparisonSection.tsx`
