# 설계 (DESIGN)

> 상세 설계: `.kiro/specs/promo-performance-dashboard/design.md` 참조

## 기술 스택

- Vite + React 18 + TypeScript
- Tailwind CSS (DESKER 디자인 토큰)
- Zustand (상태 관리)
- Recharts (차트)
- SheetJS (엑셀 파싱)
- jsPDF + html2canvas (PDF 생성)

## 아키텍처

```
ExcelParserService → AnalyticsService → promotionStore → UI Components
                                              ↕
                                     Repository (localStorage → DB)
```

## 주요 데이터 흐름

1. 파일 업로드 → ExcelParserService가 파싱 → ProductRawRow / SalesRow
2. 카테고리 매칭 → MergedProductRow (구분/대분류 포함)
3. AnalyticsService → KPI, TimeSeries, ProductRow 계산
4. Zustand store → UI 컴포넌트 렌더링

## 상품별 성과 - 환불 참고 상품 설계

- ProductRow에 refundQty 필드 포함 (엑셀 S열: 환불수량)
- ProductTable에 isRefundView prop으로 일반/환불 모드 구분
- 환불 참고 모드: 판매수량 → 환불수량 컬럼, 정렬도 refundQty 기준
- 환불비율: 엑셀 T열(환불비율(결제상품수량)) 직접 사용

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-04-06 | 환불 참고 상품 테이블 isRefundView 모드 추가 설계 |
