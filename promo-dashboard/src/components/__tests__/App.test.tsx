import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../../App';

// ============================================================
// 스토어 모킹
// ============================================================

const mockPromotionStore = {
  kpis: null,
  isDirty: false,
  inputPanelOpen: true,
  currentFiles: {},
  compareFiles: [],
  context: null,
  compareContexts: [],
  setContext: vi.fn(),
  setCurrentFile: vi.fn(),
  setCompareFile: vi.fn(),
  addCompareContext: vi.fn(),
  analyze: vi.fn(),
  toggleInputPanel: vi.fn(),
  reset: vi.fn(),
  timeSeries: [],
  hourlyData: [],
  productRows: [],
  parsedData: { current: null, compare: [] },
  drillDownDate: null,
  drillDownCategory: null,
  setDrillDownDate: vi.fn(),
  setDrillDownCategory: vi.fn(),
};

const mockCommentStore = {
  comments: [],
  isOpen: false,
  loadComments: vi.fn(),
  addComment: vi.fn(),
  addReply: vi.fn(),
  togglePanel: vi.fn(),
};

vi.mock('../../stores/promotionStore', () => ({
  usePromotionStore: (selector?: (s: typeof mockPromotionStore) => unknown) =>
    selector ? selector(mockPromotionStore) : mockPromotionStore,
}));

vi.mock('../../stores/commentStore', () => ({
  useCommentStore: (selector?: (s: typeof mockCommentStore) => unknown) =>
    selector ? selector(mockCommentStore) : mockCommentStore,
}));

// 차트 라이브러리 모킹 (jsdom 환경에서 SVG 렌더링 불가)
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ComposedChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ReferenceLine: () => null,
  Cell: () => null,
  PieChart: () => null,
  Pie: () => null,
}));

// ============================================================
// 테스트
// ============================================================

describe('App 통합 테스트', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 기본 상태로 리셋
    mockPromotionStore.kpis = null;
    mockPromotionStore.isDirty = false;
    mockPromotionStore.inputPanelOpen = true;
    mockPromotionStore.currentFiles = {};
    mockCommentStore.isOpen = false;
    mockCommentStore.comments = [];
  });

  it('기본 렌더링: Header가 표시된다', () => {
    render(<App />);
    // 헤더 내 제목 확인
    expect(screen.getByText('프로모션 성과 대시보드')).toBeInTheDocument();
  });

  it('기본 렌더링: 입력 패널이 열려있을 때 행사 정보 입력 섹션이 표시된다', () => {
    render(<App />);
    // 입력 패널 내 h2 헤더로 확인
    expect(screen.getByTestId('field-eventName')).toBeInTheDocument();
  });

  it('기본 렌더링: 파일 업로드 섹션이 표시된다', () => {
    render(<App />);
    // 파일 업로드 존 확인
    expect(screen.getByTestId('upload-sales')).toBeInTheDocument();
  });

  it('분석 버튼 클릭 전: 대시보드 섹션(dashboard-content)이 표시되지 않는다', () => {
    render(<App />);
    expect(screen.queryByTestId('dashboard-content')).not.toBeInTheDocument();
    // id로도 확인
    const dashboardSection = document.getElementById('dashboard-content');
    expect(dashboardSection).toBeNull();
  });

  it('필수 파일 없을 때: 분석 버튼이 비활성화된다', () => {
    mockPromotionStore.currentFiles = {};
    render(<App />);
    const analyzeBtn = screen.getByTestId('main-analyze-btn');
    expect(analyzeBtn).toBeDisabled();
  });

  it('필수 파일이 있을 때: 분석 버튼이 활성화된다', () => {
    mockPromotionStore.currentFiles = {
      sales: new File([''], 'sales.xlsx'),
      products: new File([''], 'products.xlsx'),
    };
    render(<App />);
    const analyzeBtn = screen.getByTestId('main-analyze-btn');
    expect(analyzeBtn).not.toBeDisabled();
  });

  it('kpis가 없을 때: 분석 버튼 텍스트가 "분석 시작"이다', () => {
    mockPromotionStore.kpis = null;
    mockPromotionStore.isDirty = false;
    render(<App />);
    expect(screen.getByTestId('main-analyze-btn')).toHaveTextContent('분석 시작');
  });

  it('kpis가 있고 isDirty=true일 때: 분석 버튼 텍스트가 "다시 분석"이다', () => {
    mockPromotionStore.kpis = {
      netSales: 1000000,
      achievementRate: 80,
      paymentAmount: 1100000,
      paymentCount: 50,
      couponTotal: 50000,
      refundAmount: 100000,
      refundRate: 5,
    };
    mockPromotionStore.isDirty = true;
    render(<App />);
    expect(screen.getByTestId('main-analyze-btn')).toHaveTextContent('다시 분석');
  });

  it('단계 안내 문구가 분석 전에 표시된다', () => {
    mockPromotionStore.kpis = null;
    render(<App />);
    expect(screen.getByText(/① 행사 정보 입력/)).toBeInTheDocument();
    expect(screen.getByText(/② 파일 업로드/)).toBeInTheDocument();
    expect(screen.getByText(/③ 분석 결과 확인/)).toBeInTheDocument();
  });

  it('입력 패널 접기/펼치기 버튼이 표시된다', () => {
    render(<App />);
    const toggleBtn = screen.getByRole('button', { name: /입력 정보/ });
    expect(toggleBtn).toBeInTheDocument();
  });

  it('inputPanelOpen=false일 때 입력 폼이 숨겨진다', () => {
    mockPromotionStore.inputPanelOpen = false;
    render(<App />);
    // 행사명 입력 필드가 없어야 함
    expect(screen.queryByTestId('field-eventName')).not.toBeInTheDocument();
  });

  it('비교 행사 섹션이 2개 표시된다', () => {
    render(<App />);
    const compareHeaders = screen.getAllByText(/비교 행사 \d/);
    expect(compareHeaders).toHaveLength(2);
  });
});
