# 태스크 (TASK)

> 전체 구현 태스크: `.kiro/specs/promo-performance-dashboard/tasks.md` 참조

## 진행 중 태스크

(현재 없음)

## 완료된 태스크

### 2026-04-06: 환불 참고 상품 섹션 수정

- [x] ProductRow 타입에 refundQty 필드 추가 (`types/index.ts`)
- [x] computeProductStats에서 refundQty 전달 (`AnalyticsService.ts`)
- [x] ProductTable에 isRefundView prop 추가 (`ProductTable.tsx`)
  - 헤더: 판매수량 → 환불수량
  - 정렬 버튼: 판매수량순 → 환불수량순
  - 구분/대분류/상품 행에서 refundQty 표시
  - 정렬 기준도 refundQty 적용
- [x] ProductSection에서 환불 참고 테이블에 isRefundView 전달 (`ProductSection.tsx`)

### 2026-04-06: CODING-RULES 적용

- [x] .gitignore에 .docx/.xlsx/.pdf/이미지 확장자 추가 (루트 + promo-dashboard)
- [x] 푸터 스타일 규칙 적용 (13px, #969696, "개발 및 수정문의")
- [x] REQ.md, DESIGN.md, TASK.md 프로젝트 루트에 생성
