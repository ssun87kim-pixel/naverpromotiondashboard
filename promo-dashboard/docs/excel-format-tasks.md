# 엑셀 다운로드 파일 서식 개선 - 작업 목록

## 작업 항목

- [x] **TASK-1**: `applyNumberFormat()` 헬퍼 함수 추가
  - 지정 컬럼/행 범위에 엑셀 셀 서식(`z` 속성) 일괄 적용
  - 파일: `src/services/ReportService.ts`

- [x] **TASK-2**: 시트1 (행사 컨텍스트) 수정
  - 매출목표: 숫자 타입으로 삽입 + `#,##0` 서식 적용
  - 파일: `src/services/ReportService.ts`

- [x] **TASK-3**: 시트2 (KPI 수치) 수정
  - 금액/수량 항목: 숫자 타입 + `#,##0` 서식
  - 달성률/환불율: 숫자 타입 (÷100) + `0.0%` 서식, null은 빈 셀
  - 파일: `src/services/ReportService.ts`

- [x] **TASK-4**: 시트3 (일별 판매성과) 수정
  - 결제금액/환불금액/최종결제액/쿠폰합계: 숫자 타입 + `#,##0` 서식
  - 파일: `src/services/ReportService.ts`

- [x] **TASK-5**: 시트4 (상품별 성과) 수정
  - 판매수량/결제금액: 숫자 타입 + `#,##0` 서식
  - 수량비중/금액비중/환불율: 숫자 타입 (÷100) + `0.0%` 서식
  - 파일: `src/services/ReportService.ts`

- [x] **TASK-6**: 불필요한 `fmtNum()`/`fmtRate()` 호출 제거
  - exportExcel 내부에서 사용하던 문자열 변환 호출 제거 + 함수 자체 삭제 (다른 곳에서 미사용)
  - 파일: `src/services/ReportService.ts`
