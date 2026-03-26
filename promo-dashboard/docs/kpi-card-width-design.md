# KPI 카드 너비 균등 분배 - 설계

## 현재 구조 (AS-IS)
- `KpiCardGrid.tsx`: 외부 `overflow-x-auto` + 내부 `flex gap-3 min-w-max`
- 각 카드: `flex-shrink-0 w-36` (고정 144px)
- 결과: 카드 7개 × 144px + gap = 약 1020px → 부모보다 좁음

## 변경 구조 (TO-BE)
- 외부: `w-full` (부모 100%)
- 내부: `grid grid-cols-7 gap-3` (7열 균등 그리드)
- 각 카드: 고정 너비 제거 → 그리드 셀에 맞춰 자동 확장

## 변경 파일
- `src/components/KpiCardGrid.tsx` — 레이아웃만 수정
