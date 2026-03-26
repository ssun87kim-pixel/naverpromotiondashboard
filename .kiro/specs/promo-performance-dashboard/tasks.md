# Implementation Plan: 프로모션 성과 대시보드

## Overview

Vite + React 18 + TypeScript 기반 단일 페이지 대시보드를 구현한다.
Repository 패턴으로 데이터 계층을 분리하고, 서비스 → 스토어 → UI 순서로 점진적으로 구축한다.

## Tasks

- [x] 1. 프로젝트 초기 설정 및 핵심 타입 정의
  - Vite + React 18 + TypeScript 프로젝트 생성
  - Tailwind CSS 설정 및 DESKER 디자인 토큰 적용 (`tailwind.config.ts`)
  - 의존성 설치: zustand, recharts, xlsx, jspdf, html2canvas, fast-check, vitest, @testing-library/react
  - `src/types/index.ts`에 모든 핵심 인터페이스 정의
    - `SalesRow`, `SalesPerformanceData`, `ProductRawRow`, `ProductPerformanceData`
    - `CategoryData`, `MergedProductData`, `MergedProductRow`
    - `KpiSummary`, `DailyTimeSeries`, `HourlyData`, `ProductRow`
    - `PromotionRecord`, `Comment`, `Reply`
    - `ParseResult<T>`, `ParseError`, `ParseWarning`
  - _Requirements: 1.1, 2.5, 3.1_

- [x] 2. Repository 계층 구현
  - [x] 2.1 Repository 인터페이스 및 LocalStorage 구현체 작성
    - `src/repositories/IPromotionRepository.ts` — 인터페이스 정의
    - `src/repositories/ICommentRepository.ts` — 인터페이스 정의
    - `src/repositories/LocalStoragePromotionRepository.ts` — save/findById/findAll 구현
    - `src/repositories/LocalStorageCommentRepository.ts` — save/findByPromotionId/addReply 구현
    - _Requirements: 1.7, 8.7_

  - [x]* 2.2 Property test: 컨텍스트 저장 Round-Trip
    - **Property 4: 컨텍스트 저장 Round-Trip**
    - **Validates: Requirements 1.7**

  - [x]* 2.3 Property test: 코멘트 저장 Round-Trip
    - **Property 21: 코멘트 저장 Round-Trip**
    - **Validates: Requirements 8.5, 8.7**

- [x] 3. ExcelParserService 구현
  - [x] 3.1 파일 형식 검증 및 기본 파서 구현
    - `src/services/ExcelParserService.ts` 생성
    - `.xlsx/.xls/.csv` 형식 검증 로직 구현 (지원 외 형식 → `ParseError` 반환)
    - SheetJS를 사용한 파일 읽기 기반 구현
    - _Requirements: 2.2, 2.7_

  - [x] 3.2 판매성과 파일 파싱 구현
    - `parseSalesPerformance(file: File): Promise<ParseResult<SalesPerformanceData>>` 구현
    - 네이버 컬럼 매핑 규칙 적용 (날짜, 요일, 시간대, 결제금액, 환불금액, 쿠폰합계)
    - 필수 컬럼 누락 시 `ParseError` + 누락 컬럼명 반환
    - 날짜 범위 불일치 시 `ParseWarning` 반환
    - _Requirements: 2.5, 2.6, 2.8, 2.9_

  - [x] 3.3 상품성과 파일 파싱 구현
    - `parseProductPerformance(file: File): Promise<ParseResult<ProductPerformanceData>>` 구현
    - 네이버 상품성과 컬럼 매핑 규칙 적용
    - _Requirements: 2.5, 2.6_

  - [x] 3.4 카테고리 파일 파싱 및 병합 구현
    - `parseCategoryFile(file: File): Promise<ParseResult<CategoryData>>` 구현
    - `mergeWithCategory(products, category): MergedProductData` 구현
    - 상품코드 ↔ 상품ID 매칭 로직, 미매칭 시 `isMatched: false` 처리
    - Category_File 없을 때 상품성과 파일의 상품카테고리(소)/상품명 대체 사용
    - _Requirements: 2.11, 2.12, 2.13_

  - [x]* 3.5 Property test: 파일 형식 유효성 검사
    - **Property 5: 파일 형식 유효성 검사**
    - **Validates: Requirements 2.2, 2.7**

  - [x]* 3.6 Property test: 파싱 결과 Standard_Schema 준수
    - **Property 6: 파싱 결과 Standard_Schema 준수**
    - **Validates: Requirements 2.5, 2.6**

  - [x]* 3.7 Property test: 필수 컬럼 누락 시 오류 명시
    - **Property 7: 필수 컬럼 누락 시 오류 명시**
    - **Validates: Requirements 2.8**

  - [x]* 3.8 Property test: 파싱 Round-Trip
    - **Property 8: 파싱 Round-Trip**
    - **Validates: Requirements 2.10**

  - [x]* 3.9 Property test: 카테고리 매칭 정확성
    - **Property 9: 카테고리 매칭 정확성**
    - **Validates: Requirements 2.11**

- [x] 4. Checkpoint — 파서 및 Repository 검증
  - 모든 테스트가 통과하는지 확인한다. 파싱 오류 처리 흐름을 점검하고 궁금한 점이 있으면 사용자에게 질문한다.

- [x] 5. AnalyticsService 구현
  - [x] 5.1 KPI 계산 구현
    - `src/services/AnalyticsService.ts` 생성
    - `computeKpis(sales, products, targetAmount): KpiSummary` 구현
    - Net_Sales = 결제금액 - 환불금액
    - Achievement_Rate = (netSales / targetAmount) × 100, targetAmount=0이면 null
    - Refund_Rate = (환불건수 / 결제수) × 100
    - _Requirements: 3.1, 3.2, 3.3_

  - [x]* 5.2 Property test: Achievement_Rate 계산 정확성
    - **Property 10: Achievement_Rate 계산 정확성**
    - **Validates: Requirements 3.2**

  - [x]* 5.3 Property test: Refund_Rate 계산 정확성
    - **Property 11: Refund_Rate 계산 정확성**
    - **Validates: Requirements 3.3**

  - [x]* 5.4 Property test: Achievement_Rate 상태 분류
    - **Property 12: Achievement_Rate 상태 분류**
    - **Validates: Requirements 3.4, 3.5**

  - [x] 5.5 시계열 데이터 계산 구현
    - `computeTimeSeries(sales): DailyTimeSeries[]` 구현
    - 일별 집계, isLiveDate 플래그, isPeak 플래그 (netSales 최대값 행만 true)
    - `computeHourly(sales, date?): HourlyData[]` 구현
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

  - [x]* 5.6 Property test: 시계열 데이터 포인트 수 일치
    - **Property 13: 시계열 데이터 포인트 수 일치**
    - **Validates: Requirements 4.2**

  - [x]* 5.7 Property test: 라이브 일자 플래그 정확성
    - **Property 14: 라이브 일자 플래그 정확성**
    - **Validates: Requirements 4.3**

  - [x]* 5.8 Property test: Peak_Time 식별 정확성
    - **Property 15: Peak_Time 식별 정확성**
    - **Validates: Requirements 4.4**

  - [x] 5.9 상품별 성과 계산 구현
    - `computeProductStats(merged): ProductRow[]` 구현
    - division → largeCat → productName 사전순 정렬
    - qtyShare, amountShare 계산 (전체 합계 대비 %)
    - isHighRefund 플래그 (평균 환불율 초과 여부)
    - _Requirements: 6.1, 6.2, 6.3, 6.9_

  - [x]* 5.10 Property test: 상품 목록 정렬 순서
    - **Property 16: 상품 목록 정렬 순서**
    - **Validates: Requirements 6.1**

  - [x]* 5.11 Property test: 파이 차트 비중 합계
    - **Property 17: 파이 차트 비중 합계**
    - **Validates: Requirements 6.4**

  - [x]* 5.12 Property test: 환불 참고 상품 플래그
    - **Property 19: 환불 참고 상품 플래그**
    - **Validates: Requirements 6.9**

- [x] 6. Zustand 스토어 구현
  - `src/stores/promotionStore.ts` 생성 — `PromotionStore` 인터페이스 전체 구현
  - `src/stores/commentStore.ts` 생성 — 코멘트 CRUD 및 리플 액션 구현
  - `analyze()` 액션: ExcelParserService → AnalyticsService 파이프라인 연결
  - `isDirty` 플래그: 입력/파일 변경 시 true, 분석 완료 시 false
  - _Requirements: 1.7, 2.3, 8.2_

- [x] 7. Checkpoint — 서비스 및 스토어 통합 검증
  - 모든 테스트가 통과하는지 확인한다. 스토어 액션 흐름을 점검하고 궁금한 점이 있으면 사용자에게 질문한다.

- [x] 8. 공통 UI 컴포넌트 구현
  - [x] 8.1 Header 컴포넌트 구현
    - `src/components/Header.tsx` — 페이지 제목, 다운로드 버튼, 코멘트 아이콘(뱃지) 포함
    - 코멘트 뱃지: 전체 코멘트 수 표시
    - _Requirements: 8.1, 8.2, 9.1_

  - [x]* 8.2 Property test: 코멘트 뱃지 수 일치
    - **Property 20: 코멘트 뱃지 수 일치**
    - **Validates: Requirements 8.2**

  - [x] 8.3 ErrorBoundary 컴포넌트 구현
    - `src/components/ErrorBoundary.tsx` — 섹션별 독립 fallback UI 제공
    - _Requirements: 3.1, 4.1, 6.3_

- [x] 9. 프로모션 컨텍스트 입력 패널 구현
  - [x] 9.1 PromotionContextForm 컴포넌트 구현
    - `src/components/PromotionContextForm.tsx`
    - 행사명, 채널명, 행사 기간(시작일/종료일), 매출 목표 금액, 프로모션 유형, 기획 의도 필드
    - 필수 항목 미입력 시 인라인 오류 메시지 표시
    - 종료일 < 시작일 시 "종료일은 시작일 이후여야 합니다" 오류 표시
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 9.2 라이브 일자 입력 UI 구현
    - 날짜 추가/삭제 방식으로 복수 입력 가능한 UI
    - _Requirements: 1.5_

  - [x]* 9.3 Property test: 필수 항목 누락 시 오류 발생
    - **Property 1: 필수 항목 누락 시 오류 발생**
    - **Validates: Requirements 1.3**

  - [x]* 9.4 Property test: 날짜 역전 시 오류 발생
    - **Property 2: 날짜 역전 시 오류 발생**
    - **Validates: Requirements 1.4**

  - [x]* 9.5 Property test: 라이브 일자 추가/삭제 불변식
    - **Property 3: 라이브 일자 추가/삭제 불변식**
    - **Validates: Requirements 1.5**

- [x] 10. 파일 업로드 패널 구현
  - [x] 10.1 FileUploadPanel 컴포넌트 구현
    - `src/components/FileUploadPanel.tsx`
    - 드래그 앤 드롭 및 파일 선택 지원
    - 이번 행사(판매성과 필수, 상품성과 필수, 카테고리 선택) 섹션
    - 비지원 확장자 드롭 시 인라인 오류 메시지 표시
    - 필수 파일 미업로드 시 분석 버튼 비활성화
    - _Requirements: 2.1, 2.2, 2.3, 2.7_

  - [x] 10.2 CompareEventUpload 컴포넌트 구현
    - 비교 행사 1, 2 독립 업로드 UI (최대 2개)
    - 비교 행사 컨텍스트 폼 포함 (Requirement 1.6)
    - _Requirements: 2.4, 1.6_

  - [x] 10.3 날짜 범위 불일치 경고 모달 구현
    - `ParseWarning` 수신 시 확인 모달 표시
    - _Requirements: 2.9_

  - [x] 10.4 카테고리 파일 미업로드 안내 구현
    - 상품별 성과 섹션 진입 시 안내 메시지 + 인라인 업로드 버튼
    - _Requirements: 2.12_

- [x] 11. KPI 카드 섹션 구현
  - [x] 11.1 KpiCard 컴포넌트 구현
    - `src/components/KpiCard.tsx` — `KpiCardProps` 인터페이스 구현
    - achieved: 좌측 테두리 green + "목표 달성" 배지
    - not-achieved: 좌측 테두리 red + "목표 미달" 배지
    - 증감 표시: ▲ green / ▼ red (환불율 반전)
    - _Requirements: 3.1, 3.4, 3.5_

  - [x] 11.2 KpiCardGrid 컴포넌트 구현
    - 7개 KPI 카드 반응형 그리드 (lg:7열, md:4열, sm:2열)
    - _Requirements: 3.1_

  - [x]* 11.3 Unit test: KpiCard 상태별 스타일 클래스 검증
    - achieved/not-achieved 상태별 CSS 클래스 확인
    - _Requirements: 3.4, 3.5_

- [x] 12. 시계열 분석 차트 섹션 구현
  - [x] 12.1 DailyLineChart 컴포넌트 구현
    - `src/components/DailyLineChart.tsx` — Recharts ComposedChart 사용
    - 막대: 결제금액(#515151), 환불금액(#F72B35)
    - 선: 최종결제액(#282828), 쿠폰합계(#336DFF)
    - 라이브 일자: 수직 점선 + "LIVE" 레이블
    - Peak: 별표 아이콘 + 툴팁
    - X축: "03/11(화)" 형식
    - 일자 클릭 → 드릴다운 핸들러 연결
    - _Requirements: 4.2, 4.3, 4.4, 4.6_

  - [x] 12.2 HourlyBarChart 컴포넌트 구현
    - `src/components/HourlyBarChart.tsx` — Recharts BarChart 사용
    - 전체 기간 보기 초기화 버튼 포함
    - _Requirements: 4.5, 4.6, 4.7_

  - [x] 12.3 TimeSeriesSection 컴포넌트 구현
    - 드릴다운 상태 관리 (날짜 클릭 → 시간별 차트 전환)
    - _Requirements: 4.1, 4.6, 4.7_

- [x] 13. 행사 비교 섹션 구현
  - [x] 13.1 ComparisonSection 컴포넌트 구현
    - `src/components/ComparisonSection.tsx`
    - 비교 행사 있을 때: 3열 레이아웃 (이번 행사 + 비교 1 + 비교 2)
    - 비교 행사 없을 때: 전체 너비 + 안내 메시지 + 업로드 버튼
    - 비교 행사 닫기(×) 버튼 → 이번 행사 전체 너비 확장
    - 대응 지표 없는 셀 빈칸 처리
    - 반응형: md:2열, sm:탭 전환
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 14. 상품별 성과 분석 섹션 구현
  - [x] 14.1 ProductTable 컴포넌트 구현
    - `src/components/ProductTable.tsx` — `ProductTableProps` 인터페이스 구현
    - 구분/대분류/상품명/판매수량/비중/결제금액/비중/환불율 컬럼
    - 정렬 기능: qty / amount / refundRate 기준 내림차순
    - "환불 참고" 배지(주황색), "미매칭" 배지(회색) 표시
    - _Requirements: 6.3, 6.7, 6.8, 6.9_

  - [x]* 14.2 Property test: 상품 테이블 정렬 기능
    - **Property 18: 상품 테이블 정렬 기능**
    - **Validates: Requirements 6.7**

  - [x] 14.3 ProductPieCharts 컴포넌트 구현
    - 판매수량 비중 파이 차트 + 결제금액 비중 파이 차트 (구분값 기준)
    - 구분값 클릭 → 대분류 드릴다운
    - 드릴다운 뒤로가기 버튼
    - _Requirements: 6.4, 6.5, 6.6_

  - [x] 14.4 ProductSection 컴포넌트 구현
    - 좌우 분할 레이아웃 (테이블 + 파이 차트), 반응형 상하 배치
    - _Requirements: 6.1, 6.2_

- [x] 15. AI 분석 섹션 구현 (Placeholder)
  - `src/components/AiAnalysisSection.tsx` — Future Scope placeholder UI 구현
  - 기획 의도 텍스트 표시 영역
  - "AI 분석 준비 중" 안내 메시지 표시
  - API 호출 실패 시 인라인 오류 메시지 처리 구조 포함
  - _Requirements: 7.1, 7.2, 7.7_

- [x] 16. 코멘트 사이드 패널 구현
  - [x] 16.1 CommentSidePanel 컴포넌트 구현
    - `src/components/CommentSidePanel.tsx` — 오른쪽 슬라이드 패널
    - 이름 + 코멘트 입력 폼, 등록 버튼
    - 빈 이름/내용 등록 시 "이름과 내용을 모두 입력해주세요" 오류 표시
    - 작성일시, 이름, 내용 표시
    - _Requirements: 8.3, 8.4, 8.5, 8.8_

  - [x] 16.2 CommentItem + ReplyList 컴포넌트 구현
    - 리플 작성 폼 (이름 + 내용 + 작성일시)
    - _Requirements: 8.6_

  - [x]* 16.3 Property test: 빈 이름/코멘트 등록 차단
    - **Property 22: 빈 이름/코멘트 등록 차단**
    - **Validates: Requirements 8.8**

  - [x]* 16.4 Unit test: CommentPanel 빈 이름 제출 시 오류 메시지 표시
    - _Requirements: 8.8_

- [x] 17. Checkpoint — UI 컴포넌트 통합 검증
  - 모든 테스트가 통과하는지 확인한다. 컴포넌트 렌더링 및 인터랙션 흐름을 점검하고 궁금한 점이 있으면 사용자에게 질문한다.

- [x] 18. 리포트 다운로드 구현
  - [x] 18.1 ReportService 구현
    - `src/services/ReportService.ts`
    - `exportExcel()`: 행사 컨텍스트, KPI, 일별/시간별 판매성과, 상품별 성과 포함 .xlsx 생성
    - `exportPdf()`: html2canvas + jsPDF, A4 기준 페이지 나눔 자동 처리
    - 파일 생성 실패 시 토스트 오류 메시지 반환
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [x] 18.2 DownloadButtons 컴포넌트 구현
    - Header에 엑셀/PDF 다운로드 버튼 연결
    - _Requirements: 9.1_

- [x] 19. App 최종 조립 및 전체 통합
  - [x] 19.1 App.tsx 조립
    - Header → InputPanel(접기/펼치기) → AnalyzeButton → DashboardSection 순서로 배치
    - InputPanel: PromotionContextForm + FileUploadPanel, 접기/펼치기 토글
    - AnalyzeButton: "분석 시작" / "다시 분석" (isDirty 상태 연동)
    - DashboardSection: KpiCardGrid → TimeSeriesSection → ComparisonSection → ProductSection → AiAnalysisSection
    - 각 섹션을 ErrorBoundary로 감싸기
    - CommentSidePanel 연결
    - _Requirements: 1.1~1.7, 2.1~2.13, 3.1~3.5, 4.1~4.7, 5.1~5.5, 6.1~6.9, 7.1, 8.1~8.8, 9.1~9.7_

  - [x]* 19.2 Unit test: 전체 분석 플로우 통합 테스트
    - 파일 업로드 → 분석 → KPI/차트/테이블 렌더링 검증
    - _Requirements: 3.1, 4.2, 6.3_

- [x] 20. Final Checkpoint — 전체 테스트 통과 확인
  - 모든 테스트가 통과하는지 확인한다. 전체 플로우를 점검하고 궁금한 점이 있으면 사용자에게 질문한다.

## Notes

- 대시보드 이름: **네이버 프로모션 성과 대시보드** (채널은 네이버 고정, 채널명 입력 필드 없음)
- 프로모션 유형 입력 필드 삭제
- 숫자 포맷: 모든 금액·수량은 3자리 쉼표 구분 표시 (`src/utils/format.ts` 공통 유틸 사용)
- KPI 카드: `whitespace-nowrap` 그리드로 줄바꿈 없이 한 줄 표시
- 시계열 차트: 일별 클릭 시 해당 날짜 `computeHourly(sales, date)` 필터링으로 시간대별 차트 연동
- 원형 차트: 상위 4개 레이블+비중 파이 조각 위 직접 표시, `labelLine=true`로 연결선 표시
- 엑셀 다운로드 포맷: 금액·수량 쉼표 포맷, 비율 백분율 소수점 첫째 자리 표시
- 파일 업로드 존: 각 파일 레이블 옆 다운로드 경로 안내 텍스트 추가
- 상품 테이블 정렬: 구분/대분류 집계 행도 sortKey 기준 합계값으로 내림차순 정렬
- 저장 버튼: 저장 완료 시 "✓ 저장됨" 피드백 2초 표시
- 분석 흐름: `FileUploadPanel`의 "분석 시작" 버튼이 파일 전달 + `analyze(files)` 단일 호출로 처리. 파일을 직접 사용하여 store set 타이밍 문제 해결
- 분석 완료 시 `dashboard-content` 섹션으로 자동 스크롤 (`scrollIntoView({ behavior: 'smooth' })`)
- 미저장 분석 시작: 행사 정보 미저장 상태에서 분석 시작 클릭 시 "저장 후 진행이 가능합니다. 저장하시겠습니까?" 모달 표시. 확인 시 행사 정보 저장 후 분석 진행. 저장 실패(필수 항목 미입력) 시 분석 차단
- 시계열 분석: 요일별 집계 테이블(최종결제액/결제금액/환불금액/쿠폰합계) → 일별 그래프 순서로 표시 (`WeekdayTable` 컴포넌트, `computeWeekdaySummary` 함수)
- 상품별 성과: 원형 차트 전체 너비 + 높이 280px, 테이블은 드롭다운 계층 구조(구분 → 대분류 → 상품명)
- `*` 표시 태스크는 선택 사항으로 MVP 속도를 위해 건너뛸 수 있다
- 각 태스크는 특정 요구사항을 참조하여 추적 가능성을 확보한다
- 속성 기반 테스트는 `fast-check`로 최소 100회 반복 실행한다
- 테스트 파일 태그 형식: `// Feature: promo-performance-dashboard, Property N: <property_text>`
- Repository 패턴으로 localStorage ↔ DB 교체가 가능한 구조를 유지한다
