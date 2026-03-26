# Design Document: 프로모션 성과 대시보드

## Overview

외부몰(네이버) 프로모션 성과 데이터를 자동으로 시각화하는 **네이버 프로모션 성과 대시보드**다.
담당자가 엑셀 파일을 업로드하면 KPI 카드, 시계열 차트, 상품별 성과 테이블을 즉시 생성한다.
이전 행사와의 비교, 공유 코멘트, 리포트 다운로드까지 한 화면에서 처리한다.

### 핵심 설계 원칙

- **단일 페이지 플로우**: 입력 → 업로드 → 분석 결과가 스크롤 한 흐름으로 이어진다
- **Repository 패턴**: localStorage와 미래 DB를 교체 가능한 구조로 분리한다
- **DESKER 디자인 시스템**: 모노크로매틱 기반, Primary 80% / Secondary 15% / Attention 5% 비율 준수
- **명시적 갱신**: 입력 변경 후 "다시 분석" 버튼을 눌러야 대시보드가 갱신된다
- **자동 스크롤**: 분석 완료 시 `dashboard-content` 섹션으로 `scrollIntoView({ behavior: 'smooth' })` 자동 스크롤한다

---

## Architecture

### 전체 구조

```
┌─────────────────────────────────────────────────────────┐
│  Browser                                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │  React App (Vite + TypeScript)                   │  │
│  │                                                  │  │
│  │  ┌─────────────┐   ┌──────────────────────────┐ │  │
│  │  │  UI Layer   │   │  State Layer (Zustand)   │ │  │
│  │  │  Components │◄──│  promotionStore          │ │  │
│  │  │  Pages      │   │  commentStore            │ │  │
│  │  └──────┬──────┘   └──────────┬───────────────┘ │  │
│  │         │                     │                  │  │
│  │  ┌──────▼──────────────────────▼──────────────┐  │  │
│  │  │  Service Layer                             │  │  │
│  │  │  ExcelParserService  AnalyticsService      │  │  │
│  │  │  ReportService       CommentService        │  │  │
│  │  └──────────────────────┬─────────────────────┘  │  │
│  │                         │                        │  │
│  │  ┌──────────────────────▼─────────────────────┐  │  │
│  │  │  Repository Layer (교체 가능)               │  │  │
│  │  │  IPromotionRepository  ICommentRepository  │  │  │
│  │  │  LocalStoragePromotionRepo (현재 구현)      │  │  │
│  │  └──────────────────────┬─────────────────────┘  │  │
│  │                         │                        │  │
│  │  ┌──────────────────────▼─────────────────────┐  │  │
│  │  │  localStorage                              │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 페이지 레이아웃 플로우

```
┌─────────────────────────────────────────────────────────┐
│  Header: 페이지 제목 | 다운로드 버튼 | 코멘트 아이콘(뱃지) │
├─────────────────────────────────────────────────────────┤
│  ① 행사 정보 입력 패널 (접기/펼치기)                      │
│    행사명 / 채널 / 기간 / 라이브일자 / 목표금액 / 유형     │
├─────────────────────────────────────────────────────────┤
│  ② 파일 업로드 패널 (접기/펼치기)                         │
│    이번 행사: 판매성과(필수) / 상품성과(필수) / 카테고리   │
│    비교 행사 1 (선택) / 비교 행사 2 (선택)                │
│    [분석 시작] 또는 [다시 분석] 버튼                      │
├─────────────────────────────────────────────────────────┤
│  ③ 분석 결과 (스크롤)                                    │
│    3-1. KPI 카드 (7개)                                   │
│    3-2. 시계열 분석 차트                                  │
│    3-3. 행사 비교 섹션                                    │
│    3-4. 상품별 성과 분석                                  │
│    3-5. AI 분석 (Future Scope — placeholder)             │
├─────────────────────────────────────────────────────────┤
│  코멘트 사이드 패널 (오른쪽 슬라이드)                      │
└─────────────────────────────────────────────────────────┘
```

### 기술 스택

| 역할 | 라이브러리 |
|---|---|
| UI 프레임워크 | React 18 + TypeScript |
| 빌드 도구 | Vite |
| 스타일링 | Tailwind CSS (DESKER 토큰 적용) |
| 상태 관리 | Zustand |
| 차트 | Recharts |
| 엑셀 파싱/생성 | xlsx (SheetJS) |
| PDF 생성 | jsPDF + html2canvas |
| 영속성 | localStorage (Repository 패턴으로 추상화) |

---

## Components and Interfaces

### 컴포넌트 트리

```
App
├── Header
│   ├── PageTitle
│   ├── DownloadButtons (Excel / PDF)
│   └── CommentIconButton (뱃지)
├── InputPanel (접기/펼치기)
│   ├── PromotionContextForm  ← Requirement 1 (행사명, 기간, 라이브일자, 목표금액, 기획의도 — 프로모션유형 없음)
│   └── FileUploadPanel       ← Requirement 2
│       ├── CurrentEventUpload
│       └── CompareEventUpload (×2)
├── SaveConfirmModal (행사 정보 미저장 시 분석 시작 클릭 → "저장 후 진행이 가능합니다. 저장하시겠습니까?" 모달 → 확인 시 저장 후 분석 진행, 저장 실패(필수 항목 미입력) 시 분석 차단)
├── DashboardSection (분석 결과)
│   ├── KpiCardGrid           ← Requirement 3
│   ├── TimeSeriesSection     ← Requirement 4
│   │   ├── DailyLineChart
│   │   └── HourlyBarChart
│   ├── ComparisonSection     ← Requirement 5
│   ├── ProductSection        ← Requirement 6
│   │   ├── ProductTable
│   │   └── ProductPieCharts
│   └── AiAnalysisSection     ← Requirement 7 (placeholder)
└── CommentSidePanel          ← Requirement 8
    ├── CommentForm
    └── CommentList
        └── CommentItem
            └── ReplyList
```

### 주요 컴포넌트 인터페이스

```typescript
// KPI 카드
interface KpiCardProps {
  label: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down' | null;
  trendValue?: number;
  isInverted?: boolean;   // 환불율: 증가가 나쁜 지표
  status?: 'achieved' | 'not-achieved' | 'neutral';
}

// 시계열 차트
interface TimeSeriesChartProps {
  data: DailyTimeSeries[];
  liveDates: string[];          // 라이브 진행일자
  onDayClick: (date: string) => void;
  drillDownDate: string | null;
}

// 상품 테이블
interface ProductTableProps {
  rows: ProductRow[];
  sortKey: 'qty' | 'amount' | 'refundRate';
  onSortChange: (key: string) => void;
  onCategoryClick: (category: string) => void;
  drillDownCategory: string | null;
}

// 코멘트 패널
interface CommentSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  comments: Comment[];
  onAddComment: (name: string, content: string) => void;
  onAddReply: (commentId: string, name: string, content: string) => void;
}
```

### Service 인터페이스

```typescript
// Repository 인터페이스 (localStorage ↔ DB 교체 가능)
interface IPromotionRepository {
  save(promotion: PromotionRecord): Promise<void>;
  findById(id: string): Promise<PromotionRecord | null>;
  findAll(): Promise<PromotionRecord[]>;
}

interface ICommentRepository {
  save(comment: Comment): Promise<void>;
  findByPromotionId(promotionId: string): Promise<Comment[]>;
  addReply(commentId: string, reply: Reply): Promise<void>;
}

// Excel Parser Service
interface IExcelParserService {
  parseSalesPerformance(file: File): Promise<SalesPerformanceData>;
  parseProductPerformance(file: File): Promise<ProductPerformanceData>;
  parseCategoryFile(file: File): Promise<CategoryData>;
  mergeWithCategory(
    products: ProductPerformanceData,
    category: CategoryData
  ): MergedProductData;
}

// Analytics Service
interface IAnalyticsService {
  computeKpis(
    sales: SalesPerformanceData,
    products: ProductPerformanceData,
    targetAmount: number
  ): KpiSummary;
  computeTimeSeries(sales: SalesPerformanceData): DailyTimeSeries[];
  computeHourly(sales: SalesPerformanceData, date?: string): HourlyData[];
  computeProductStats(merged: MergedProductData): ProductRow[];
}
```

---

## Data Models

### Standard Schema (파싱 결과 공통 구조)

```typescript
// 판매성과 파일 → 파싱 결과
interface SalesPerformanceData {
  rows: SalesRow[];
  dateRange: { start: string; end: string };
}

interface SalesRow {
  date: string;          // YYYY-MM-DD
  dayOfWeek: string;     // 월~일
  hour?: number;         // 0~23 (시간대 컬럼 있을 때)
  paymentAmount: number; // 결제금액
  refundAmount: number;  // 환불금액
  couponTotal: number;   // 쿠폰합계
}

// 상품성과 파일 → 파싱 결과
interface ProductPerformanceData {
  rows: ProductRawRow[];
}

interface ProductRawRow {
  productId: string;
  productName: string;
  categoryLarge: string;
  categoryMedium: string;
  categorySmall: string;
  paymentCount: number;
  paymentQty: number;
  paymentAmount: number;
  couponTotal: number;
  productCoupon: number;
  orderCoupon: number;
  refundCount: number;
  refundAmount: number;
  refundQty: number;
}

// 카테고리 파일 → 파싱 결과
interface CategoryData {
  rows: CategoryRow[];
}

interface CategoryRow {
  productCode: string;
  division: string;      // 구분
  largeCat: string;      // 대분류
  mediumCat: string;     // 중분류
  smallCat: string;      // 소분류
  productName: string;   // 상품명(컬러제외)
}

// 카테고리 매칭 후 병합 데이터
interface MergedProductData {
  rows: MergedProductRow[];
}

interface MergedProductRow extends ProductRawRow {
  division: string;
  largeCat: string;
  isMatched: boolean;    // 카테고리 매칭 여부
}
```

### 분석 결과 모델

```typescript
interface KpiSummary {
  netSales: number;           // 결제금액 - 환불금액
  achievementRate: number;    // (netSales / targetAmount) × 100
  paymentAmount: number;      // 결제금액
  paymentCount: number;       // 결제수
  couponTotal: number;        // 쿠폰합계 (상품성과 파일 기준)
  refundAmount: number;       // 환불액
  refundRate: number;         // (환불건수 / 결제수) × 100
}

interface DailyTimeSeries {
  date: string;
  dayOfWeek: string;
  paymentAmount: number;
  refundAmount: number;
  netSales: number;
  couponTotal: number;
  isLiveDate: boolean;
  isPeak: boolean;
}

interface HourlyData {
  hour: number;
  paymentAmount: number;
}

interface ProductRow {
  division: string;
  largeCat: string;
  productName: string;
  productId: string;
  qty: number;
  qtyShare: number;           // 전체 대비 판매수량 비중 (%)
  netAmount: number;          // 결제금액 - 환불금액
  amountShare: number;        // 전체 결제금액 대비 비중 (%)
  refundCount: number;
  refundRate: number;         // 환불수량 / 전체 주문수량 × 100
  isHighRefund: boolean;      // 평균 환불율 초과 여부
  isUnmatched: boolean;       // 카테고리 미매칭 여부
}
```

### 프로모션 레코드 (영속성)

```typescript
interface PromotionRecord {
  id: string;
  eventName: string;
  channel: string;
  startDate: string;
  endDate: string;
  liveDates: string[];
  targetAmount: number;
  promotionType: string;
  planningIntent: string;
  createdAt: string;
  updatedAt: string;
}

interface Comment {
  id: string;
  promotionId: string;
  authorName: string;
  content: string;
  createdAt: string;
  replies: Reply[];
}

interface Reply {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
}
```

### Zustand Store 구조

```typescript
interface PromotionStore {
  // 입력 상태
  context: PromotionRecord | null;
  compareContexts: PromotionRecord[];

  // 파일 업로드 상태
  currentFiles: { sales?: File; products?: File; category?: File };
  compareFiles: Array<{ sales?: File; products?: File; category?: File }>;

  // 파싱 결과
  parsedData: {
    current: { sales?: SalesPerformanceData; products?: MergedProductData } | null;
    compare: Array<{ sales?: SalesPerformanceData; products?: MergedProductData }>;
  };

  // 분석 결과
  kpis: KpiSummary | null;
  timeSeries: DailyTimeSeries[];
  hourlyData: HourlyData[];
  productRows: ProductRow[];

  // UI 상태
  isDirty: boolean;             // 입력 변경 후 미분석 상태
  inputPanelOpen: boolean;
  drillDownDate: string | null;
  drillDownCategory: string | null;

  // Actions
  setContext: (ctx: PromotionRecord) => void;
  uploadFile: (type: string, file: File) => void;
  analyze: (files?: { sales: File; products: File; category?: File }) => Promise<void>;
  resetDrillDown: () => void;
}
```

---

## UI 디자인 상세

### analyze() 파이프라인

`analyze(files?)` 함수는 파일을 직접 인자로 받아 store에 저장 후 즉시 파싱·분석을 실행한다. 파일 업로드 버튼 클릭 시 파일 전달 → store 저장 → 파싱 → 분석 → 결과 저장이 단일 흐름으로 처리된다.

모든 금액·수량 숫자는 `toLocaleString('ko-KR')` 기반으로 3자리마다 쉼표 구분 표시한다.
- 입력 필드(매출 목표 금액): 입력 중에는 raw 숫자, 포커스 아웃 시 포맷 표시
- KPI 카드, 테이블, 차트 툴팁 등 모든 출력 영역에 적용
- KPI 카드: `whitespace-nowrap` + 가로 스크롤 그리드로 줄바꿈 없이 한 줄 표시, 폰트 크기 자동 축소
- 시계열 차트: 일별 클릭 시 해당 날짜 데이터를 `computeHourly(sales, date)`로 필터링하여 시간대별 차트 갱신
- 원형 차트: 상위 4개 항목 레이블+비중을 `customLabel` 렌더러로 파이 조각 위에 직접 표시, `labelLine=true`로 조각과 레이블 연결선 표시하여 즉시 인식 가능
- 엑셀 다운로드 포맷: 금액·수량은 `toLocaleString('ko-KR')`로 쉼표 포맷 문자열, 비율은 `(value * 100).toFixed(1) + '%'` 형식으로 출력
- 파일 업로드 존: 각 파일 레이블 옆에 다운로드 경로 안내 텍스트 표시
  - 판매성과: `네이버 어드민 > 판매관리 > 주문통합검색 > 엑셀 다운`
  - 상품성과: `네이버 어드민 > 데이터분석 > 판매분석 > 상품성과 > 엑셀 다운`
  - 카테고리: `온라인 견적서 엑셀 시트`
- 상품 테이블 정렬: 구분/대분류 집계 행도 sortKey 기준 합계값으로 내림차순 정렬
- 공통 유틸: `src/utils/format.ts` — `formatNumber(n)`, `formatCurrency(n)` 함수 제공



```css
/* Tailwind 커스텀 토큰 (tailwind.config.ts) */
colors: {
  'gray-900': '#282828',
  'gray-700': '#515151',
  'gray-400': '#B3B3B3',
  'bg-subtle': '#F5F5F5',
  'border':    '#D9D9D9',
  'blue':      '#336DFF',
  'red':       '#F72B35',
  'green':     '#00B441',
  'orange':    '#FF5948',
}
```

### KPI 카드 레이아웃

```
┌─────────────────────────────────────────────────────────┐
│  KPI 카드 그리드 (lg: 7열, md: 4열, sm: 2열, xs: 1열)   │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ...            │
│  │ Net_Sales│ │달성률    │ │결제금액  │                  │
│  │          │ │          │ │          │                  │
│  │ 28px bold│ │ 28px bold│ │ 28px bold│                  │
│  │ ₩123,456 │ │ 87.3%    │ │ ₩234,567 │                  │
│  │          │ │ ▼ 미달성 │ │          │                  │
│  └──────────┘ └──────────┘ └──────────┘                  │
└─────────────────────────────────────────────────────────┘
```

- 달성률 100% 이상: 카드 좌측 테두리 2px `--color-green`, 배지 "목표 달성"
- 달성률 100% 미만: 카드 좌측 테두리 2px `--color-red`, 배지 "목표 미달"
- 증감 표시: 증가 `#00B441 ▲`, 감소 `#F72B35 ▼` (환불율은 반전)
- 숫자 짤림 방지: `break-all` + 폰트 크기 22px로 조정, 카드 `min-w-0` 설정

### 시계열 분석 레이아웃

```
┌─────────────────────────────────────────────────────────┐
│  요일별 집계 테이블 (월~일, 최종결제액/결제금액/환불금액/쿠폰합계)  │
├─────────────────────────────────────────────────────────┤
│  일별 추이 (ComposedChart)                               │
│  - 막대: 결제금액 (#515151), 환불금액 (#F72B35)          │
│  - 선: 최종결제액 (#282828), 쿠폰합계 (#336DFF)          │
│  - 라이브일자: 수직 점선 + "LIVE" 레이블 (#336DFF)       │
│  - Peak: 별표 아이콘 + 툴팁                              │
│  X축: "03/11(화)" 형식                                   │
│                                                         │
│  [전체 기간 보기] 버튼 (드릴다운 시 표시)                 │
├─────────────────────────────────────────────────────────┤
│  시간대별 바 차트 (BarChart)                             │
│  - 막대: 결제금액 (#515151)                              │
│  - X축: 0시~23시                                        │
└─────────────────────────────────────────────────────────┘
```

### 비교 섹션 레이아웃

```
비교 행사 있을 때:
┌──────────────────┬──────────────────┬──────────────────┐
│  이번 행사       │  비교 행사 1     │  비교 행사 2     │
│  (1/3 너비)      │  (1/3 너비)      │  (1/3 너비)      │
│                  │  [×] 닫기        │  [×] 닫기        │
└──────────────────┴──────────────────┴──────────────────┘

비교 행사 없을 때 / 닫은 후:
┌──────────────────────────────────────────────────────────┐
│  이번 행사 (전체 너비)                                    │
│  "이전 행사 파일을 업로드하면 비교 분석이 가능합니다"      │
│  [파일 업로드] 버튼                                       │
└──────────────────────────────────────────────────────────┘
```

### 상품별 성과 레이아웃

```
┌──────────────────────────────────────────────────────────┐
│  원형 차트 2개 (판매수량 비중 / 결제금액 비중) — 전체 너비, 충분한 높이  │
├──────────────────────────────────────────────────────────┤
│  상품 테이블 — 드롭다운 계층 구조                           │
│  ▶ 구분A  (집계 합계)                                      │
│    ▶ 대분류1  (집계 합계)                                   │
│        상품명1 | 수량 | 비중 | 결제금액 | 비중 | 환불율      │
│        상품명2 | ...                                       │
│    ▶ 대분류2  ...                                          │
│  ▶ 구분B  ...                                             │
│  [환불 참고] 배지 (주황색) / [미매칭] 배지 (회색)            │
└──────────────────────────────────────────────────────────┘
```

### 반응형 브레이크포인트 적용

| 섹션 | xl/lg | md | sm/xs |
|---|---|---|---|
| KPI 카드 | 7열 | 4열 | 2열 |
| 시계열 차트 | 전체 너비 | 전체 너비 | 스크롤 |
| 비교 섹션 | 3열 | 2열 | 탭 전환 |
| 상품 섹션 | 좌우 분할 | 상하 배치 | 상하 배치 |

---

## Error Handling

### 파일 업로드 오류

| 오류 상황 | 처리 방식 | 표시 위치 |
|---|---|---|
| 지원하지 않는 파일 형식 | 인라인 오류 메시지 | 업로드 영역 하단 |
| 필수 컬럼 누락 | 누락 컬럼명 명시 오류 | 업로드 영역 하단 |
| 날짜 범위 불일치 | 경고 + 계속 진행 확인 모달 | 모달 다이얼로그 |
| 필수 파일 미업로드 | 분석 버튼 비활성화 + 오류 메시지 | 버튼 상단 |

### 폼 유효성 오류

| 오류 상황 | 메시지 |
|---|---|
| 필수 항목 누락 | 해당 필드 하단 인라인 오류 |
| 종료일 < 시작일 | "종료일은 시작일 이후여야 합니다" |
| 이름/코멘트 미입력 | "이름과 내용을 모두 입력해주세요" |

### 다운로드 오류

```typescript
// 파일 생성 실패 시 토스트 알림
showToast({ type: 'error', message: '파일 생성에 실패했습니다. 다시 시도해주세요.' });
```

### AI 분석 오류 (Future Scope)

- API 호출 실패 시 해당 섹션에 "AI 분석을 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요" 표시
- 나머지 대시보드 기능은 정상 동작 유지

### 오류 경계 (Error Boundary)

- 각 섹션(KPI, 차트, 테이블)을 독립적인 ErrorBoundary로 감싸 한 섹션 오류가 전체에 영향을 주지 않도록 한다

---

## Testing Strategy

### 이중 테스트 접근법

단위 테스트(구체적 예시·엣지 케이스)와 속성 기반 테스트(보편적 속성)를 함께 사용한다.

**단위 테스트 (Vitest + React Testing Library)**
- 특정 입력값에 대한 계산 결과 검증
- 컴포넌트 렌더링 및 인터랙션 검증
- 오류 조건 및 엣지 케이스 검증

**속성 기반 테스트 (fast-check)**
- 임의 입력에 대해 보편적 속성이 성립하는지 검증
- 각 테스트는 최소 100회 반복 실행
- 태그 형식: `// Feature: promo-performance-dashboard, Property N: <property_text>`

### 테스트 파일 구조

```
src/
├── services/
│   ├── __tests__/
│   │   ├── excelParser.test.ts      # 단위 + 속성 테스트
│   │   └── analytics.test.ts        # 단위 + 속성 테스트
├── components/
│   ├── __tests__/
│   │   ├── KpiCard.test.tsx
│   │   ├── ProductTable.test.tsx
│   │   └── CommentPanel.test.tsx
```


---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: 필수 항목 누락 시 오류 발생

*For any* 프로모션 컨텍스트 폼 제출에서, 행사명·채널명·행사 기간 중 하나 이상이 비어있으면 해당 필드를 명시하는 유효성 오류가 반드시 발생해야 한다.

**Validates: Requirements 1.3**

---

### Property 2: 날짜 역전 시 오류 발생

*For any* 날짜 쌍 (startDate, endDate)에서, endDate < startDate이면 "종료일은 시작일 이후여야 합니다" 오류가 반드시 발생해야 한다.

**Validates: Requirements 1.4**

---

### Property 3: 라이브 일자 추가/삭제 불변식

*For any* 라이브 일자 목록에서, 날짜를 추가하면 목록 길이가 1 증가하고 삭제하면 1 감소해야 한다.

**Validates: Requirements 1.5**

---

### Property 4: 컨텍스트 저장 Round-Trip

*For any* 유효한 프로모션 컨텍스트 객체를 Repository에 저장하고 다시 읽으면, 저장 전과 동일한 값이 반환되어야 한다.

**Validates: Requirements 1.7**

---

### Property 5: 파일 형식 유효성 검사

*For any* 파일 확장자에서, .xlsx / .xls / .csv 이외의 확장자는 파서가 오류를 반환해야 하고, 지원 형식은 오류 없이 처리되어야 한다.

**Validates: Requirements 2.2, 2.7**

---

### Property 6: 파싱 결과 Standard_Schema 준수

*For any* 유효한 네이버 판매성과 또는 상품성과 파일에 대해, ExcelParser가 반환하는 객체는 Standard_Schema의 모든 필수 필드를 포함해야 한다.

**Validates: Requirements 2.5, 2.6**

---

### Property 7: 필수 컬럼 누락 시 오류 명시

*For any* 필수 컬럼(상품ID, 결제금액, 주문일시) 중 하나 이상이 누락된 파일에 대해, ExcelParser는 누락된 컬럼명을 포함하는 오류를 반환해야 한다.

**Validates: Requirements 2.8**

---

### Property 8: 파싱 Round-Trip

*For any* 유효한 판매성과 데이터를 Standard_Schema로 파싱한 후 원본 구조로 재구성하면, 원본 데이터와 동일한 행 수와 값을 가져야 한다.

**Validates: Requirements 2.10**

---

### Property 9: 카테고리 매칭 정확성

*For any* 카테고리 파일과 상품성과 파일에서, 상품코드와 상품ID가 일치하는 모든 항목에 대해 병합 결과의 division·largeCat 필드가 카테고리 파일의 값과 동일해야 한다.

**Validates: Requirements 2.11**

---

### Property 10: Achievement_Rate 계산 정확성

*For any* netSales 값과 targetAmount 값(> 0)에 대해, computeKpis가 반환하는 achievementRate는 `(netSales / targetAmount) × 100`과 소수점 첫째 자리까지 일치해야 한다.

**Validates: Requirements 3.2**

---

### Property 11: Refund_Rate 계산 정확성

*For any* refundCount 값과 paymentCount 값(> 0)에 대해, computeKpis가 반환하는 refundRate는 `(refundCount / paymentCount) × 100`과 소수점 첫째 자리까지 일치해야 한다.

**Validates: Requirements 3.3**

---

### Property 12: Achievement_Rate 상태 분류

*For any* achievementRate 값에 대해, 100 이상이면 KPI 카드 status가 'achieved'이고, 100 미만이면 'not-achieved'여야 한다.

**Validates: Requirements 3.4, 3.5**

---

### Property 13: 시계열 데이터 포인트 수 일치

*For any* 판매성과 데이터에서, computeTimeSeries가 반환하는 배열의 길이는 데이터 내 고유 날짜 수와 일치해야 한다.

**Validates: Requirements 4.2**

---

### Property 14: 라이브 일자 플래그 정확성

*For any* 시계열 데이터와 라이브 일자 목록에서, isLiveDate 플래그는 해당 날짜가 라이브 일자 목록에 포함된 경우에만 true여야 한다.

**Validates: Requirements 4.3**

---

### Property 15: Peak_Time 식별 정확성

*For any* 시계열 데이터에서, isPeak 플래그는 netSales가 최대인 행에만 true여야 하고, 나머지 행은 모두 false여야 한다.

**Validates: Requirements 4.4**

---

### Property 16: 상품 목록 정렬 순서

*For any* 상품 목록에서, computeProductStats가 반환하는 배열은 division → largeCat → productName 순서로 사전순 정렬되어야 한다.

**Validates: Requirements 6.1**

---

### Property 17: 파이 차트 비중 합계

*For any* 상품 데이터에서, 구분값별 qtyShare 합계와 amountShare 합계는 각각 100(%)이어야 한다 (부동소수점 허용 오차 ±0.1).

**Validates: Requirements 6.4**

---

### Property 18: 상품 테이블 정렬 기능

*For any* 상품 목록과 정렬 기준(qty / amount / refundRate)에서, 정렬 후 인접한 두 행은 해당 기준으로 내림차순 관계를 만족해야 한다.

**Validates: Requirements 6.7**

---

### Property 19: 환불 참고 상품 플래그

*For any* 상품 목록에서, isHighRefund 플래그는 해당 상품의 refundRate가 전체 상품 평균 refundRate를 초과하는 경우에만 true여야 한다.

**Validates: Requirements 6.9**

---

### Property 20: 코멘트 뱃지 수 일치

*For any* 코멘트 목록에서, 헤더 뱃지에 표시되는 숫자는 전체 코멘트 수(리플 제외)와 일치해야 한다.

**Validates: Requirements 8.2**

---

### Property 21: 코멘트 저장 Round-Trip

*For any* 유효한 코멘트 객체(이름, 내용 모두 비어있지 않음)를 CommentRepository에 저장하고 다시 읽으면, 저장 전과 동일한 authorName·content·createdAt 값이 반환되어야 한다.

**Validates: Requirements 8.5, 8.7**

---

### Property 22: 빈 이름/코멘트 등록 차단

*For any* 코멘트 등록 시도에서, 이름 또는 내용 중 하나라도 공백 문자만으로 구성되거나 비어있으면 등록이 거부되고 오류 메시지가 표시되어야 한다.

**Validates: Requirements 8.8**

---

## Error Handling (상세)

### 오류 처리 전략 요약

| 계층 | 오류 유형 | 처리 방식 |
|---|---|---|
| ExcelParser | 파일 형식 오류 | `ParseError` 반환 (throw 아님) |
| ExcelParser | 필수 컬럼 누락 | `ParseError` + 누락 컬럼 목록 |
| ExcelParser | 날짜 범위 불일치 | `ParseWarning` 반환 → UI에서 확인 모달 |
| Analytics | 0으로 나누기 | targetAmount=0이면 achievementRate=null |
| Repository | localStorage 쓰기 실패 | 콘솔 경고 + 토스트 알림 |
| Report | 파일 생성 실패 | 토스트 오류 메시지 |
| AI API | 호출 실패 | 섹션 내 인라인 오류 메시지 |
| 컴포넌트 | 렌더링 오류 | ErrorBoundary → 섹션별 fallback UI |

### 오류 타입 정의

```typescript
type ParseResult<T> =
  | { ok: true; data: T; warnings: ParseWarning[] }
  | { ok: false; error: ParseError };

interface ParseError {
  code: 'INVALID_FORMAT' | 'MISSING_COLUMNS' | 'EMPTY_FILE';
  message: string;
  missingColumns?: string[];
}

interface ParseWarning {
  code: 'DATE_RANGE_MISMATCH';
  message: string;
  detail: { expected: string; actual: string };
}
```

---

## Testing Strategy (상세)

### 단위 테스트 (Vitest + React Testing Library)

구체적인 예시, 엣지 케이스, 오류 조건을 검증한다.

**ExcelParser 단위 테스트 예시**
- 정상 판매성과 파일 파싱 → 올바른 행 수 반환
- 필수 컬럼 누락 파일 → ParseError 반환 + 컬럼명 포함
- 빈 파일 → ParseError 반환
- 카테고리 파일 없을 때 대체 분류 적용

**Analytics 단위 테스트 예시**
- targetAmount = 0일 때 achievementRate = null
- 환불건수 = 0일 때 refundRate = 0
- 시계열 데이터 1개 행 → isPeak = true

**컴포넌트 단위 테스트 예시**
- KpiCard: achieved/not-achieved 상태별 스타일 클래스 확인
- CommentPanel: 빈 이름 제출 시 오류 메시지 표시
- FileUpload: 비지원 확장자 드롭 시 오류 메시지 표시

### 속성 기반 테스트 (fast-check, 최소 100회 반복)

각 테스트는 아래 태그 형식으로 주석을 달아 설계 문서와 연결한다.

```
// Feature: promo-performance-dashboard, Property N: <property_text>
```

**속성 테스트 구현 예시**

```typescript
// Feature: promo-performance-dashboard, Property 10: Achievement_Rate 계산 정확성
it('achievementRate = (netSales / targetAmount) × 100', () => {
  fc.assert(
    fc.property(
      fc.float({ min: 0, max: 1e9 }),
      fc.float({ min: 1, max: 1e9 }),
      (netSales, targetAmount) => {
        const result = computeKpis({ netSales, targetAmount, ... });
        const expected = Math.round((netSales / targetAmount) * 1000) / 10;
        expect(result.achievementRate).toBeCloseTo(expected, 1);
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: promo-performance-dashboard, Property 8: 파싱 Round-Trip
it('parse then reconstruct returns same row count', () => {
  fc.assert(
    fc.property(
      arbitrarySalesData(),
      (data) => {
        const parsed = parseSalesPerformance(data);
        const reconstructed = reconstructFromSchema(parsed.data);
        expect(reconstructed.length).toBe(data.rows.length);
      }
    ),
    { numRuns: 100 }
  );
});
```

**속성별 테스트 매핑**

| Property | 테스트 파일 | fast-check Arbitrary |
|---|---|---|
| 1 (필수 항목 누락) | contextForm.test.ts | `fc.subarray(requiredFields)` |
| 2 (날짜 역전) | contextForm.test.ts | `fc.tuple(fc.date(), fc.date())` |
| 3 (라이브 일자 추가/삭제) | liveDates.test.ts | `fc.array(fc.date())` |
| 4 (컨텍스트 Round-Trip) | promotionRepo.test.ts | `arbitraryPromotion()` |
| 5 (파일 형식 유효성) | excelParser.test.ts | `fc.string()` (확장자) |
| 6 (Standard_Schema 준수) | excelParser.test.ts | `arbitrarySalesFile()` |
| 7 (필수 컬럼 누락 오류) | excelParser.test.ts | `fc.subarray(requiredColumns)` |
| 8 (파싱 Round-Trip) | excelParser.test.ts | `arbitrarySalesData()` |
| 9 (카테고리 매칭) | excelParser.test.ts | `arbitraryCategoryAndProduct()` |
| 10 (Achievement_Rate) | analytics.test.ts | `fc.float()` |
| 11 (Refund_Rate) | analytics.test.ts | `fc.float()` |
| 12 (Achievement_Rate 상태) | analytics.test.ts | `fc.float()` |
| 13 (시계열 포인트 수) | analytics.test.ts | `arbitrarySalesData()` |
| 14 (라이브 일자 플래그) | analytics.test.ts | `fc.array(fc.date())` |
| 15 (Peak_Time 식별) | analytics.test.ts | `arbitraryTimeSeries()` |
| 16 (상품 정렬) | analytics.test.ts | `arbitraryProductList()` |
| 17 (파이 차트 비중 합계) | analytics.test.ts | `arbitraryProductList()` |
| 18 (상품 테이블 정렬) | analytics.test.ts | `arbitraryProductList()` |
| 19 (환불 참고 상품 플래그) | analytics.test.ts | `arbitraryProductList()` |
| 20 (코멘트 뱃지 수) | commentStore.test.ts | `fc.array(arbitraryComment())` |
| 21 (코멘트 Round-Trip) | commentRepo.test.ts | `arbitraryComment()` |
| 22 (빈 코멘트 차단) | commentForm.test.ts | `fc.string()` (공백 포함) |
