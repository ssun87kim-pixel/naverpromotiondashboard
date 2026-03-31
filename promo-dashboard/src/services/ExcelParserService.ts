import * as XLSX from 'xlsx';
import type {
  ParseResult,
  ParseError,
  ParseWarning,
  SalesPerformanceData,
  SalesRow,
  ProductPerformanceData,
  ProductRawRow,
  CategoryData,
  CategoryRow,
  MergedProductData,
  MergedProductRow,
} from '../types/index';

// ============================================================
// 지원 파일 형식
// ============================================================

const SUPPORTED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

function getExtension(filename: string): string {
  const idx = filename.lastIndexOf('.');
  if (idx === -1) return '';
  return filename.slice(idx).toLowerCase();
}

function isSupported(filename: string): boolean {
  return SUPPORTED_EXTENSIONS.includes(getExtension(filename));
}

// ============================================================
// 파일 → ArrayBuffer 읽기
// ============================================================

async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target!.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsArrayBuffer(file);
  });
}

// ============================================================
// SheetJS로 첫 번째 시트를 JSON 배열로 변환
// ============================================================

function sheetToRows(buffer: ArrayBuffer): Record<string, unknown>[] {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    raw: false,
  });
}

// ============================================================
// 컬럼 탐색 헬퍼 (부분 일치)
// ============================================================

function findColumn(
  row: Record<string, unknown>,
  candidates: string[]
): string | undefined {
  const keys = Object.keys(row);
  for (const candidate of candidates) {
    const found = keys.find((k) => k.includes(candidate));
    if (found !== undefined) return found;
  }
  return undefined;
}

function findColumnInHeaders(
  headers: string[],
  candidates: string[]
): string | undefined {
  for (const candidate of candidates) {
    const found = headers.find((k) => k.includes(candidate));
    if (found !== undefined) return found;
  }
  return undefined;
}

// ============================================================
// 날짜 문자열 정규화 → YYYY-MM-DD
// ============================================================

function normalizeDate(raw: unknown): string {
  if (typeof raw !== 'string' && typeof raw !== 'number') return String(raw);
  const s = String(raw).trim();
  // YYYY-MM-DD 또는 YYYY/MM/DD
  const m1 = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m1) {
    return `${m1[1]}-${m1[2].padStart(2, '0')}-${m1[3].padStart(2, '0')}`;
  }
  // YYYYMMDD
  const m2 = s.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (m2) {
    return `${m2[1]}-${m2[2]}-${m2[3]}`;
  }
  return s;
}

function toNumber(raw: unknown): number {
  if (typeof raw === 'number') return raw;
  const s = String(raw).replace(/,/g, '').trim();
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

// ============================================================
// 3.1 파일 형식 검증
// ============================================================

function validateFormat(file: File): ParseError | null {
  if (!isSupported(file.name)) {
    return {
      code: 'INVALID_FORMAT',
      message:
        '지원하지 않는 파일 형식입니다. xlsx, xls, csv 파일을 업로드해주세요',
    };
  }
  return null;
}

// ============================================================
// 3.2 판매성과 파일 파싱
// ============================================================

// 네이버 판매성과 컬럼 매핑
const SALES_COL_DATE = ['날짜'];
const SALES_COL_DOW = ['요일'];
const SALES_COL_HOUR = ['시간대'];
const SALES_COL_PAYMENT = ['결제금액'];
const SALES_COL_REFUND = ['환불금액'];
const SALES_COL_COUPON = ['쿠폰합계'];

export async function parseSalesPerformance(
  file: File
): Promise<ParseResult<SalesPerformanceData>> {
  const formatError = validateFormat(file);
  if (formatError) return { ok: false, error: formatError };

  const buffer = await readFileAsArrayBuffer(file);
  const rows = sheetToRows(buffer);

  if (rows.length === 0) {
    return {
      ok: false,
      error: { code: 'EMPTY_FILE', message: '파일에 데이터가 없습니다.' },
    };
  }

  const headers = Object.keys(rows[0]);

  // 필수 컬럼 확인
  const dateCol = findColumnInHeaders(headers, SALES_COL_DATE);
  const paymentCol = findColumnInHeaders(headers, SALES_COL_PAYMENT);

  const missing: string[] = [];
  if (!dateCol) missing.push('날짜');
  if (!paymentCol) missing.push('결제금액');

  if (missing.length > 0) {
    return {
      ok: false,
      error: {
        code: 'MISSING_COLUMNS',
        message: `필수 컬럼이 누락되었습니다: ${missing.join(', ')}`,
        missingColumns: missing,
      },
    };
  }

  const dowCol = findColumnInHeaders(headers, SALES_COL_DOW);
  const hourCol = findColumnInHeaders(headers, SALES_COL_HOUR);
  const refundCol = findColumnInHeaders(headers, SALES_COL_REFUND);
  const couponCol = findColumnInHeaders(headers, SALES_COL_COUPON);

  const salesRows: SalesRow[] = rows.map((r) => {
    const row: SalesRow = {
      date: normalizeDate(r[dateCol!]),
      dayOfWeek: dowCol ? String(r[dowCol] ?? '') : '',
      paymentAmount: toNumber(r[paymentCol!]),
      refundAmount: refundCol ? toNumber(r[refundCol]) : 0,
      couponTotal: couponCol ? toNumber(r[couponCol]) : 0,
    };
    if (hourCol) {
      const h = toNumber(r[hourCol]);
      row.hour = h;
    }
    return row;
  });

  // dateRange 계산
  const dates = salesRows.map((r) => r.date).filter(Boolean).sort();
  const dateRange = {
    start: dates[0] ?? '',
    end: dates[dates.length - 1] ?? '',
  };

  const warnings: ParseWarning[] = [];

  return { ok: true, data: { rows: salesRows, dateRange }, warnings };
}

// ============================================================
// 3.3 상품성과 파일 파싱
// ============================================================

const PROD_COL_ID = ['상품ID', '상품 ID'];
const PROD_COL_NAME = ['상품명'];
const PROD_COL_CAT_L = ['상품카테고리(대)', '카테고리(대)', '대분류'];
const PROD_COL_CAT_M = ['상품카테고리(중)', '카테고리(중)', '중분류'];
const PROD_COL_CAT_S = ['상품카테고리(소)', '카테고리(소)', '소분류'];
const PROD_COL_PAY_CNT = ['결제수'];
const PROD_COL_PAY_QTY = ['결제상품수량'];
const PROD_COL_PAY_AMT = ['결제금액'];
const PROD_COL_COUPON = ['쿠폰합계'];
const PROD_COL_PROD_COUPON = ['상품쿠폰'];
const PROD_COL_ORDER_COUPON = ['주문쿠폰'];
const PROD_COL_REFUND_CNT = ['환불건수'];
const PROD_COL_REFUND_AMT = ['환불금액'];
const PROD_COL_REFUND_QTY = ['환불수량'];
const PROD_COL_REFUND_RATE = ['환불비율'];

export async function parseProductPerformance(
  file: File
): Promise<ParseResult<ProductPerformanceData>> {
  const formatError = validateFormat(file);
  if (formatError) return { ok: false, error: formatError };

  const buffer = await readFileAsArrayBuffer(file);
  const rows = sheetToRows(buffer);

  if (rows.length === 0) {
    return {
      ok: false,
      error: { code: 'EMPTY_FILE', message: '파일에 데이터가 없습니다.' },
    };
  }

  const headers = Object.keys(rows[0]);

  const idCol = findColumnInHeaders(headers, PROD_COL_ID);
  const paymentCol = findColumnInHeaders(headers, PROD_COL_PAY_AMT);

  const missing: string[] = [];
  if (!idCol) missing.push('상품ID');
  if (!paymentCol) missing.push('결제금액');

  if (missing.length > 0) {
    return {
      ok: false,
      error: {
        code: 'MISSING_COLUMNS',
        message: `필수 컬럼이 누락되었습니다: ${missing.join(', ')}`,
        missingColumns: missing,
      },
    };
  }

  const nameCol = findColumnInHeaders(headers, PROD_COL_NAME);
  const catLCol = findColumnInHeaders(headers, PROD_COL_CAT_L);
  const catMCol = findColumnInHeaders(headers, PROD_COL_CAT_M);
  const catSCol = findColumnInHeaders(headers, PROD_COL_CAT_S);
  const payCntCol = findColumnInHeaders(headers, PROD_COL_PAY_CNT);
  const payQtyCol = findColumnInHeaders(headers, PROD_COL_PAY_QTY);
  const couponCol = findColumnInHeaders(headers, PROD_COL_COUPON);
  const prodCouponCol = findColumnInHeaders(headers, PROD_COL_PROD_COUPON);
  const orderCouponCol = findColumnInHeaders(headers, PROD_COL_ORDER_COUPON);
  const refundCntCol = findColumnInHeaders(headers, PROD_COL_REFUND_CNT);
  const refundAmtCol = findColumnInHeaders(headers, PROD_COL_REFUND_AMT);
  const refundQtyCol = findColumnInHeaders(headers, PROD_COL_REFUND_QTY);
  const refundRateCol = findColumnInHeaders(headers, PROD_COL_REFUND_RATE);

  const productRows: ProductRawRow[] = rows.map((r) => ({
    productId: String(r[idCol!] ?? ''),
    productName: nameCol ? String(r[nameCol] ?? '') : '',
    categoryLarge: catLCol ? String(r[catLCol] ?? '') : '',
    categoryMedium: catMCol ? String(r[catMCol] ?? '') : '',
    categorySmall: catSCol ? String(r[catSCol] ?? '') : '',
    paymentCount: payCntCol ? toNumber(r[payCntCol]) : 0,
    paymentQty: payQtyCol ? toNumber(r[payQtyCol]) : 0,
    paymentAmount: toNumber(r[paymentCol!]),
    couponTotal: couponCol ? toNumber(r[couponCol]) : 0,
    productCoupon: prodCouponCol ? toNumber(r[prodCouponCol]) : 0,
    orderCoupon: orderCouponCol ? toNumber(r[orderCouponCol]) : 0,
    refundCount: refundCntCol ? toNumber(r[refundCntCol]) : 0,
    refundAmount: refundAmtCol ? toNumber(r[refundAmtCol]) : 0,
    refundQty: refundQtyCol ? toNumber(r[refundQtyCol]) : 0,
    ...(refundRateCol ? { refundRate: toNumber(r[refundRateCol]) } : {}),
  }));

  return { ok: true, data: { rows: productRows }, warnings: [] };
}

// ============================================================
// 3.4 카테고리 파일 파싱
// ============================================================

const CAT_COL_CODE = ['상품코드'];
const CAT_COL_DIV = ['구분'];
const CAT_COL_LARGE = ['대분류'];
const CAT_COL_MEDIUM = ['중분류'];
const CAT_COL_SMALL = ['소분류'];
const CAT_COL_NAME = ['상품명(컬러제외)', '상품명'];

export async function parseCategoryFile(
  file: File
): Promise<ParseResult<CategoryData>> {
  const formatError = validateFormat(file);
  if (formatError) return { ok: false, error: formatError };

  const buffer = await readFileAsArrayBuffer(file);
  const rows = sheetToRows(buffer);

  if (rows.length === 0) {
    return {
      ok: false,
      error: { code: 'EMPTY_FILE', message: '파일에 데이터가 없습니다.' },
    };
  }

  const headers = Object.keys(rows[0]);

  const codeCol = findColumnInHeaders(headers, CAT_COL_CODE);
  const divCol = findColumnInHeaders(headers, CAT_COL_DIV);
  const largeCol = findColumnInHeaders(headers, CAT_COL_LARGE);
  const mediumCol = findColumnInHeaders(headers, CAT_COL_MEDIUM);
  const smallCol = findColumnInHeaders(headers, CAT_COL_SMALL);
  const nameCol = findColumnInHeaders(headers, CAT_COL_NAME);

  const catRows: CategoryRow[] = rows.map((r) => ({
    productCode: codeCol ? String(r[codeCol] ?? '') : '',
    division: divCol ? String(r[divCol] ?? '') : '',
    largeCat: largeCol ? String(r[largeCol] ?? '') : '',
    mediumCat: mediumCol ? String(r[mediumCol] ?? '') : '',
    smallCat: smallCol ? String(r[smallCol] ?? '') : '',
    productName: nameCol ? String(r[nameCol] ?? '') : '',
  }));

  return { ok: true, data: { rows: catRows }, warnings: [] };
}

// ============================================================
// 3.4 카테고리 병합
// ============================================================

export function mergeWithCategory(
  products: ProductPerformanceData,
  category: CategoryData | null
): MergedProductData {
  if (!category) {
    // 카테고리 파일 없음 → 상품성과 파일의 categorySmall/productName 대체
    const merged: MergedProductRow[] = products.rows.map((p) => ({
      ...p,
      division: p.categorySmall,
      largeCat: p.productName,
      isMatched: false,
    }));
    return { rows: merged };
  }

  // 상품코드 → CategoryRow 맵 생성
  const catMap = new Map<string, CategoryRow>();
  for (const c of category.rows) {
    catMap.set(c.productCode, c);
  }

  const merged: MergedProductRow[] = products.rows.map((p) => {
    const cat = catMap.get(p.productId);
    if (cat) {
      return {
        ...p,
        division: cat.division,
        largeCat: cat.largeCat,
        isMatched: true,
      };
    }
    return {
      ...p,
      division: '미매칭',
      largeCat: '미매칭',
      isMatched: false,
    };
  });

  return { rows: merged };
}
