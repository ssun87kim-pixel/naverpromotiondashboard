# 엑셀 다운로드 파일 서식 개선 - 설계

## 현재 구조 (AS-IS)
- `ReportService.ts`의 `exportExcel()` 함수에서 `XLSX.utils.aoa_to_sheet()`로 시트 생성
- `fmtNum()`, `fmtRate()` 헬퍼로 숫자를 **문자열로 변환** 후 셀에 삽입
- 결과: 엑셀에서 모든 값이 텍스트로 인식됨

## 변경 구조 (TO-BE)
- 숫자/비율 값을 **원시 숫자 타입 그대로** 셀에 삽입
- `XLSX` 셀 객체에 `z` (number format) 속성을 직접 지정하여 서식 적용
- `fmtNum()`, `fmtRate()` 헬퍼는 엑셀 내보내기에서 제거 (PDF 등 다른 곳에서 사용 중이면 유지)

## 핵심 변경점

### 1. aoa_to_sheet → 숫자 원본 삽입
```
AS-IS: fmtNum(kpis.netSales)  → "1,234,567" (문자열)
TO-BE: kpis.netSales           → 1234567    (숫자)
```

### 2. 셀 서식(number format) 적용 함수 추가
시트 생성 후 특정 컬럼에 셀 서식을 일괄 적용하는 헬퍼 함수 작성:

```typescript
// 숫자 쉼표: "#,##0"
// 백분율:   "0.0%"
function applyNumberFormat(ws: XLSX.WorkSheet, col: number, startRow: number, endRow: number, fmt: string): void
```

### 3. 백분율 값 변환
현재 코드의 `KpiSummary`, `ProductRow`의 비율 필드는 이미 **백분율 값** (예: 36.4)으로 저장됨.
엑셀 `%` 서식은 소수(0.364)를 기대하므로 **100으로 나누어** 저장:

```
AS-IS: 36.4 → "36.4%" (문자열)
TO-BE: 36.4 / 100 = 0.364 → 엑셀 서식 "0.0%" → "36.4%" 표시
```

`null` 값(달성률 등)은 빈 셀로 유지.

### 4. 파일 변경 범위
- `src/services/ReportService.ts` — `exportExcel()` 함수만 수정
- 다른 파일 변경 없음
