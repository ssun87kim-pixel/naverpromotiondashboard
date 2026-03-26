# 비교 행사 나란히 표시 - 설계

## 시계열 차트: 오버레이
- 같은 차트에 이번 행사/비교 행사 선을 겹쳐 표시 (색상 구분)
- 범례에 행사명 표시
- 일별 차트만 오버레이, 시간대별은 각각 표시

## 요일별 테이블: 좌우 나란히
- 이번 행사 | 비교 행사 테이블을 가로 배치

## 상품 테이블: 좌우 나란히
- 이번 행사 | 비교 행사 테이블/파이차트를 가로 배치
- 화면 좁으면 상하 배치 (반응형)

## 변경 파일
- `src/components/TimeSeriesSection.tsx`
- `src/components/ProductSection.tsx`
- `src/components/DailyLineChart.tsx` (오버레이 데이터 지원)
