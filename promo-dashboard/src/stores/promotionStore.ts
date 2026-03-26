import { create } from 'zustand';
import {
  parseSalesPerformance,
  parseProductPerformance,
  parseCategoryFile,
  mergeWithCategory,
} from '../services/ExcelParserService';
import {
  computeKpis,
  computeTimeSeries,
  computeHourly,
  computeProductStats,
} from '../services/AnalyticsService';
import type {
  PromotionRecord,
  SalesPerformanceData,
  MergedProductData,
  KpiSummary,
  DailyTimeSeries,
  HourlyData,
  ProductRow,
} from '../types/index';

// ============================================================
// 타입 정의
// ============================================================

type FileSet = { sales?: File; products?: File; category?: File };

type ParsedEntry = {
  sales?: SalesPerformanceData;
  products?: MergedProductData;
};

interface PromotionStore {
  // 입력 상태
  context: PromotionRecord | null;
  compareContexts: PromotionRecord[]; // 최대 1개

  // 파일 업로드 상태
  currentFiles: FileSet;
  compareFiles: FileSet[];

  // 파싱 결과
  parsedData: {
    current: ParsedEntry | null;
    compare: ParsedEntry[];
  };

  // 분석 결과
  kpis: KpiSummary | null;
  compareKpis: (KpiSummary | null)[];
  compareTimeSeries: DailyTimeSeries[][];
  compareHourlyData: HourlyData[][];
  compareProductRows: ProductRow[][];
  timeSeries: DailyTimeSeries[];
  hourlyData: HourlyData[];
  productRows: ProductRow[];

  // UI 상태
  isDirty: boolean;
  inputPanelOpen: boolean;
  drillDownDate: string | null;
  drillDownCategory: string | null;

  // Actions
  setContext: (ctx: PromotionRecord) => void;
  addCompareContext: (ctx: PromotionRecord) => void;
  setCompareContext: (index: number, ctx: Partial<PromotionRecord>) => void;
  setCurrentFile: (type: 'sales' | 'products' | 'category', file: File) => void;
  setCompareFile: (
    index: number,
    type: 'sales' | 'products' | 'category',
    file: File
  ) => void;
  analyze: (files?: { sales?: File; products?: File; category?: File }, signal?: AbortSignal) => Promise<void>;
  removeCompare: (index: number) => void;
  setDrillDownDate: (date: string | null) => void;
  setDrillDownCategory: (cat: string | null) => void;
  toggleInputPanel: () => void;
  reset: () => void;
}

// ============================================================
// 초기 상태
// ============================================================

const initialState = {
  context: null,
  compareContexts: [] as PromotionRecord[],
  currentFiles: {} as FileSet,
  compareFiles: [] as FileSet[],
  parsedData: {
    current: null,
    compare: [] as ParsedEntry[],
  },
  kpis: null,
  compareKpis: [] as (KpiSummary | null)[],
  compareTimeSeries: [] as DailyTimeSeries[][],
  compareHourlyData: [] as HourlyData[][],
  compareProductRows: [] as ProductRow[][],
  timeSeries: [] as DailyTimeSeries[],
  hourlyData: [] as HourlyData[],
  productRows: [] as ProductRow[],
  isDirty: false,
  inputPanelOpen: true,
  drillDownDate: null,
  drillDownCategory: null,
};

// ============================================================
// Zustand 스토어
// ============================================================

export const usePromotionStore = create<PromotionStore>((set, get) => ({
  ...initialState,

  setContext: (ctx) => {
    set({ context: ctx, isDirty: true });
  },

  addCompareContext: (ctx) => {
    set((state) => {
      const updated = [...state.compareContexts];
      if (updated.length < 1) {
        updated.push(ctx);
      } else {
        updated[updated.length - 1] = ctx;
      }
      return { compareContexts: updated, isDirty: true };
    });
  },

  setCompareContext: (index, patch) => {
    set((state) => {
      const updated = [...state.compareContexts];
      const blank: PromotionRecord = {
        id: `compare-${index}`, eventName: '', channel: 'naver', startDate: '', endDate: '',
        liveDates: [], targetAmount: 0, promotionType: '', planningIntent: '',
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      while (updated.length <= index) {
        updated.push(blank);
      }
      updated[index] = { ...updated[index], ...patch };
      return { compareContexts: updated, isDirty: true };
    });
  },

  setCurrentFile: (type, file) => {
    set((state) => ({
      currentFiles: { ...state.currentFiles, [type]: file },
      isDirty: true,
    }));
  },

  setCompareFile: (index, type, file) => {
    set((state) => {
      const updated = [...state.compareFiles];
      while (updated.length <= index) {
        updated.push({});
      }
      updated[index] = { ...updated[index], [type]: file };
      return { compareFiles: updated, isDirty: true };
    });
  },

  analyze: async (files, signal) => {
    // 파일이 직접 전달된 경우 store에도 저장하고 직접 사용
    if (files) {
      set((state) => ({
        currentFiles: {
          ...state.currentFiles,
          ...(files.sales !== undefined ? { sales: files.sales } : {}),
          ...(files.products !== undefined ? { products: files.products } : {}),
          ...(files.category !== undefined ? { category: files.category } : {}),
        },
      }));
    }

    // files가 직접 전달된 경우 그것을 사용, 아니면 store에서 가져옴
    const salesFile = files?.sales ?? get().currentFiles.sales;
    const productsFile = files?.products ?? get().currentFiles.products;
    const categoryFile = files?.category ?? get().currentFiles.category;
    const context = get().context;

    if (!salesFile && !productsFile) {
      throw new Error('판매성과 또는 상품성과 파일이 필요합니다');
    }

    // 1. 판매성과 파싱 (선택)
    let salesData: SalesPerformanceData | null = null;
    if (salesFile) {
      const salesResult = await parseSalesPerformance(salesFile);
      if (signal?.aborted) throw new DOMException('분석이 취소되었습니다', 'AbortError');
      if (!salesResult.ok) throw new Error(salesResult.error.message);
      salesData = salesResult.data;
    }

    // 2. 상품성과 파싱 (선택)
    let productsData: import('../types/index').ProductPerformanceData | null = null;
    if (productsFile) {
      const productsResult = await parseProductPerformance(productsFile);
      if (signal?.aborted) throw new DOMException('분석이 취소되었습니다', 'AbortError');
      if (!productsResult.ok) throw new Error(productsResult.error.message);
      productsData = productsResult.data;
    }

    // 3. 카테고리 파싱 (선택)
    let categoryData = null;
    if (categoryFile) {
      const catResult = await parseCategoryFile(categoryFile);
      if (signal?.aborted) throw new DOMException('분석이 취소되었습니다', 'AbortError');
      if (catResult.ok) {
        categoryData = catResult.data;
      }
    }

    // 4. 카테고리 병합 (상품성과 있을 때만)
    const mergedData = productsData ? mergeWithCategory(productsData, categoryData) : null;
    if (signal?.aborted) throw new DOMException('분석이 취소되었습니다', 'AbortError');

    // 5. KPI 계산
    const targetAmount = context?.targetAmount ?? 0;
    const kpis = computeKpis(salesData, productsData, targetAmount);

    // 6. 시계열 계산 (판매성과 있을 때만)
    const liveDates = context?.liveDates ?? [];
    const timeSeries = salesData ? computeTimeSeries(salesData, liveDates) : [];

    // 7. 시간대별 계산 (판매성과 있을 때만)
    const hourlyData = salesData ? computeHourly(salesData) : [];

    // 8. 상품별 성과 계산 (상품성과 있을 때만)
    const productRows = mergedData ? computeProductStats(mergedData) : [];

    // 9. 비교 행사 분석
    const compareFiles = get().compareFiles;
    const compareContexts = get().compareContexts;
    const compareParsed: ParsedEntry[] = [];
    const compareKpisResult: (KpiSummary | null)[] = [];
    const compareTimeSeriesResult: DailyTimeSeries[][] = [];
    const compareHourlyResult: HourlyData[][] = [];
    const compareProductResult: ProductRow[][] = [];

    for (let i = 0; i < compareFiles.length; i++) {
      const cf = compareFiles[i];
      if (!cf.sales && !cf.products) {
        compareParsed.push({});
        compareKpisResult.push(null);
        compareTimeSeriesResult.push([]);
        compareHourlyResult.push([]);
        compareProductResult.push([]);
        continue;
      }
      if (signal?.aborted) throw new DOMException('분석이 취소되었습니다', 'AbortError');

      let cSales: SalesPerformanceData | null = null;
      if (cf.sales) {
        const r = await parseSalesPerformance(cf.sales);
        if (signal?.aborted) throw new DOMException('분석이 취소되었습니다', 'AbortError');
        if (r.ok) cSales = r.data;
      }

      let cProducts: import('../types/index').ProductPerformanceData | null = null;
      if (cf.products) {
        const r = await parseProductPerformance(cf.products);
        if (signal?.aborted) throw new DOMException('분석이 취소되었습니다', 'AbortError');
        if (r.ok) cProducts = r.data;
      }

      let cCategory = null;
      if (cf.category) {
        const r = await parseCategoryFile(cf.category);
        if (r.ok) cCategory = r.data;
      }

      const cMerged = cProducts ? mergeWithCategory(cProducts, cCategory) : null;
      const cTarget = compareContexts[i]?.targetAmount ?? 0;
      const cKpis = computeKpis(cSales, cProducts, cTarget);
      const cLiveDates = compareContexts[i]?.liveDates ?? [];
      const cTimeSeries = cSales ? computeTimeSeries(cSales, cLiveDates) : [];
      const cHourly = cSales ? computeHourly(cSales) : [];
      const cProductRows = cMerged ? computeProductStats(cMerged) : [];

      compareParsed.push({
        sales: cSales ?? undefined,
        products: cMerged ?? undefined,
      });
      compareKpisResult.push(cKpis);
      compareTimeSeriesResult.push(cTimeSeries);
      compareHourlyResult.push(cHourly);
      compareProductResult.push(cProductRows);
    }

    // 10. 결과 저장
    set({
      parsedData: {
        current: { sales: salesData ?? undefined, products: mergedData ?? undefined },
        compare: compareParsed,
      },
      kpis,
      compareKpis: compareKpisResult,
      compareTimeSeries: compareTimeSeriesResult,
      compareHourlyData: compareHourlyResult,
      compareProductRows: compareProductResult,
      timeSeries,
      hourlyData,
      productRows,
      isDirty: false,
    });
  },

  removeCompare: (index) => {
    set((state) => {
      const updatedContexts = state.compareContexts.filter((_, i) => i !== index);
      const updatedFiles = state.compareFiles.filter((_, i) => i !== index);
      const updatedKpis = state.compareKpis.filter((_, i) => i !== index);
      const updatedTimeSeries = state.compareTimeSeries.filter((_, i) => i !== index);
      const updatedHourly = state.compareHourlyData.filter((_, i) => i !== index);
      const updatedProducts = state.compareProductRows.filter((_, i) => i !== index);
      const updatedParsed = state.parsedData.compare.filter((_, i) => i !== index);
      return {
        compareContexts: updatedContexts,
        compareFiles: updatedFiles,
        compareKpis: updatedKpis,
        compareTimeSeries: updatedTimeSeries,
        compareHourlyData: updatedHourly,
        compareProductRows: updatedProducts,
        parsedData: { ...state.parsedData, compare: updatedParsed },
      };
    });
  },

  setDrillDownDate: (date) => set({ drillDownDate: date }),

  setDrillDownCategory: (cat) => set({ drillDownCategory: cat }),

  toggleInputPanel: () =>
    set((state) => ({ inputPanelOpen: !state.inputPanelOpen })),

  reset: () => set({ ...initialState }),
}));
