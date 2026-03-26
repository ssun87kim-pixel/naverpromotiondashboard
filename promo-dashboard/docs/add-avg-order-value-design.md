# 객단가 KPI 추가 - 설계

## 변경 파일

### 1. types/index.ts — KpiSummary에 avgOrderValue 필드 추가
- `avgOrderValue: number | null` (paymentCount=0이면 null)

### 2. services/AnalyticsService.ts — computeKpis에서 계산
- `avgOrderValue = paymentCount > 0 ? netSales / paymentCount : null`
- sales 또는 products가 null이면 null

### 3. components/KpiCardGrid.tsx — 결제수 뒤에 객단가 카드 추가
- needsSales + needsProducts 둘 다 true (양쪽 파일 필요)

### 4. components/ComparisonSection.tsx — 결제수 아래에 객단가 행 추가

### 5. services/ReportService.ts — 엑셀 KPI 시트에 객단가 행 추가
