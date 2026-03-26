# 비교 행사 전체 섹션 표시 - 설계

## Store 변경
- `compareProductRows: ProductRow[][]` 추가
- `compareHourlyData: HourlyData[][]` 추가
- analyze()에서 비교 행사별 productRows, hourlyData 계산

## UI 변경: 탭 전환 방식
- 비교 행사가 있을 때 각 섹션 상단에 탭 표시
  - "이번 행사" | "비교 행사 1" | "비교 행사 2"
- 탭 클릭 시 해당 행사의 데이터로 전환
- 비교 행사 없으면 탭 없이 기존과 동일

## 변경 파일
- `src/stores/promotionStore.ts` — compareProductRows, compareHourlyData 추가
- `src/components/TimeSeriesSection.tsx` — 탭 전환 추가
- `src/components/ProductSection.tsx` — 탭 전환 추가
