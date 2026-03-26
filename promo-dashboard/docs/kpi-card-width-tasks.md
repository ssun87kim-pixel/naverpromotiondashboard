# KPI 카드 너비 균등 분배 - 작업 목록

- [x] **TASK-1**: KpiCardGrid 레이아웃을 flex → grid 7열 균등 분배로 변경
  - 외부 `overflow-x-auto` 제거
  - 내부 `flex gap-3 min-w-max` → `grid grid-cols-7 gap-3`
  - 카드 래퍼 `flex-shrink-0 w-36` 제거
  - 파일: `src/components/KpiCardGrid.tsx`
