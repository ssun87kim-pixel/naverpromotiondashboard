# KPI 2행 추가 - 설계

## 데이터
- 일평균 순매출: netSales / (endDate - startDate + 1일), context 필요
- 라이브일자 순매출: timeSeries에서 isLiveDate인 행의 netSales

## KpiCardGrid 변경
- props에 context(startDate/endDate), timeSeries 추가
- 1행: 기존 카드 (grid)
- 2행: 일평균 순매출 + 라이브 N일차 카드들 (동적 개수)
- 2행도 동일한 카드 스타일, 균등 분배

## 변경 파일
- `src/components/KpiCardGrid.tsx` — 2행 추가
- `src/App.tsx` — KpiCardGrid에 context, timeSeries props 전달
