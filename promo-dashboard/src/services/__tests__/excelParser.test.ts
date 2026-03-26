/**
 * Feature: promo-performance-dashboard
 * ExcelParserService — 단위 테스트 + 속성 기반 테스트 (Property 5~9)
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as XLSX from 'xlsx';
import {
  parseSalesPerformance,
  parseProductPerformance,
  parseCategoryFile,
  mergeWithCategory,
} from '../ExcelParserService';
import type {
  ProductPerformanceData,
  CategoryData,
} from '../../types/index';

// ============================================================
// 테스트 헬퍼: SheetJS로 엑셀 파일(File 객체) 생성
// ============================================================

function makeXlsxFile(
  rows: Record<string, unknown>[],
  filename = 'test.xlsx'
): File {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const buf: ArrayBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new File([buf], filename, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

function makeSalesRows(n = 3) {
  return Array.from({ length: n }, (_, i) => ({
    날짜: `2026-03-${String(i + 1).padStart(2, '0')}`,
    요일: '월',
    결제금액: (i + 1) * 1000,
    환불금액: 0,
    쿠폰합계: 0,
  }));
}

function makeProductRows(n = 2) {
  return Array.from({ length: n }, (_, i) => ({
    상품ID: `P${i + 1}`,
    상품명: `상품${i + 1}`,
    '상품카테고리(대)': '대',
    '상품카테고리(중)': '중',
    '상품카테고리(소)': '소',
    결제수: 10,
    결제상품수량: 5,
    결제금액: (i + 1) * 2000,
    쿠폰합계: 0,
    상품쿠폰: 0,
    주문쿠폰: 0,
    환불건수: 0,
    환불금액: 0,
    환불수량: 0,
  }));
}

// ============================================================
// 단위 테스트
// ============================================================

describe('ExcelParserService — 단위 테스트', () => {
  describe('parseSalesPerformance', () => {
    it('정상 판매성과 파일 파싱 → 올바른 행 수 반환', async () => {
      const file = makeXlsxFile(makeSalesRows(5));
      const result = await parseSalesPerformance(file);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.rows).toHaveLength(5);
      }
    });

    it('dateRange start/end 계산', async () => {
      const file = makeXlsxFile(makeSalesRows(3));
      const result = await parseSalesPerformance(file);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.dateRange.start).toBe('2026-03-01');
        expect(result.data.dateRange.end).toBe('2026-03-03');
      }
    });

    it('필수 컬럼(날짜) 누락 → ParseError + missingColumns', async () => {
      const rows = [{ 결제금액: 1000, 환불금액: 0, 쿠폰합계: 0 }];
      const file = makeXlsxFile(rows);
      const result = await parseSalesPerformance(file);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('MISSING_COLUMNS');
        expect(result.error.missingColumns).toContain('날짜');
      }
    });

    it('지원하지 않는 확장자 → INVALID_FORMAT', async () => {
      const file = new File(['data'], 'test.pdf', { type: 'application/pdf' });
      const result = await parseSalesPerformance(file);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_FORMAT');
      }
    });
  });

  describe('parseProductPerformance', () => {
    it('정상 상품성과 파일 파싱', async () => {
      const file = makeXlsxFile(makeProductRows(4));
      const result = await parseProductPerformance(file);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.rows).toHaveLength(4);
        expect(result.data.rows[0].productId).toBe('P1');
      }
    });

    it('필수 컬럼(상품ID) 누락 → ParseError', async () => {
      const rows = [{ 결제금액: 1000 }];
      const file = makeXlsxFile(rows);
      const result = await parseProductPerformance(file);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('MISSING_COLUMNS');
        expect(result.error.missingColumns).toContain('상품ID');
      }
    });
  });

  describe('mergeWithCategory', () => {
    it('category=null → categorySmall/productName 대체', () => {
      const products: ProductPerformanceData = {
        rows: [
          {
            productId: 'P1', productName: '상품A',
            categoryLarge: '대', categoryMedium: '중', categorySmall: '소',
            paymentCount: 1, paymentQty: 1, paymentAmount: 1000,
            couponTotal: 0, productCoupon: 0, orderCoupon: 0,
            refundCount: 0, refundAmount: 0, refundQty: 0,
          },
        ],
      };
      const merged = mergeWithCategory(products, null);
      expect(merged.rows[0].division).toBe('소');
      expect(merged.rows[0].largeCat).toBe('상품A');
      expect(merged.rows[0].isMatched).toBe(false);
    });

    it('매칭 성공 → isMatched=true, division/largeCat 설정', () => {
      const products: ProductPerformanceData = {
        rows: [
          {
            productId: 'P1', productName: '상품A',
            categoryLarge: '', categoryMedium: '', categorySmall: '',
            paymentCount: 1, paymentQty: 1, paymentAmount: 1000,
            couponTotal: 0, productCoupon: 0, orderCoupon: 0,
            refundCount: 0, refundAmount: 0, refundQty: 0,
          },
        ],
      };
      const category: CategoryData = {
        rows: [
          {
            productCode: 'P1', division: '구분A', largeCat: '대분류A',
            mediumCat: '중', smallCat: '소', productName: '상품A',
          },
        ],
      };
      const merged = mergeWithCategory(products, category);
      expect(merged.rows[0].isMatched).toBe(true);
      expect(merged.rows[0].division).toBe('구분A');
      expect(merged.rows[0].largeCat).toBe('대분류A');
    });

    it('매칭 실패 → isMatched=false, division/largeCat=미매칭', () => {
      const products: ProductPerformanceData = {
        rows: [
          {
            productId: 'UNKNOWN', productName: '상품X',
            categoryLarge: '', categoryMedium: '', categorySmall: '',
            paymentCount: 1, paymentQty: 1, paymentAmount: 500,
            couponTotal: 0, productCoupon: 0, orderCoupon: 0,
            refundCount: 0, refundAmount: 0, refundQty: 0,
          },
        ],
      };
      const category: CategoryData = {
        rows: [{ productCode: 'P1', division: 'D', largeCat: 'L', mediumCat: 'M', smallCat: 'S', productName: 'N' }],
      };
      const merged = mergeWithCategory(products, category);
      expect(merged.rows[0].isMatched).toBe(false);
      expect(merged.rows[0].division).toBe('미매칭');
      expect(merged.rows[0].largeCat).toBe('미매칭');
    });
  });
});

// ============================================================
// Property 5: 파일 형식 유효성 검사
// Feature: promo-performance-dashboard, Property 5: 파일 형식 유효성 검사
// Validates: Requirements 2.2, 2.7
// ============================================================

describe('Property 5: 파일 형식 유효성 검사', () => {
  it('.xlsx/.xls/.csv 외 확장자는 INVALID_FORMAT 반환', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 10 }).filter(
          (ext) =>
            !['xlsx', 'xls', 'csv'].includes(ext.toLowerCase().replace(/^\./, ''))
        ),
        async (ext) => {
          const safeExt = ext.replace(/[^a-zA-Z0-9]/g, 'x') || 'bin';
          const filename = `test.${safeExt}`;
          const file = new File(['data'], filename, { type: 'application/octet-stream' });
          const result = await parseSalesPerformance(file);
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.error.code).toBe('INVALID_FORMAT');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('.xlsx/.xls/.csv 확장자는 형식 오류 없이 처리 시도', async () => {
    const supported = ['.xlsx', '.xls', '.csv'];
    for (const ext of supported) {
      // 빈 파일이므로 EMPTY_FILE 또는 MISSING_COLUMNS 오류가 나야 하고 INVALID_FORMAT은 아님
      const file = makeXlsxFile(makeSalesRows(1), `test${ext}`);
      const result = await parseSalesPerformance(file);
      if (!result.ok) {
        expect(result.error.code).not.toBe('INVALID_FORMAT');
      }
    }
  });
});

// ============================================================
// Property 6: 파싱 결과 Standard_Schema 준수
// Feature: promo-performance-dashboard, Property 6: 파싱 결과 Standard_Schema 준수
// Validates: Requirements 2.5, 2.6
// ============================================================

describe('Property 6: 파싱 결과 Standard_Schema 준수', () => {
  // 임의 판매성과 행 생성 Arbitrary
  const arbitrarySalesRow = fc.record({
    날짜: fc.integer({ min: 1, max: 28 }).map((d) => `2026-03-${String(d).padStart(2, '0')}`),
    요일: fc.constantFrom('월', '화', '수', '목', '금', '토', '일'),
    결제금액: fc.integer({ min: 0, max: 1_000_000 }),
    환불금액: fc.integer({ min: 0, max: 100_000 }),
    쿠폰합계: fc.integer({ min: 0, max: 50_000 }),
  });

  it('유효한 판매성과 데이터 → 모든 필수 필드 포함', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbitrarySalesRow, { minLength: 1, maxLength: 20 }),
        async (rows) => {
          const file = makeXlsxFile(rows);
          const result = await parseSalesPerformance(file);
          expect(result.ok).toBe(true);
          if (result.ok) {
            expect(result.data).toHaveProperty('rows');
            expect(result.data).toHaveProperty('dateRange');
            expect(result.data.dateRange).toHaveProperty('start');
            expect(result.data.dateRange).toHaveProperty('end');
            for (const row of result.data.rows) {
              expect(row).toHaveProperty('date');
              expect(row).toHaveProperty('dayOfWeek');
              expect(row).toHaveProperty('paymentAmount');
              expect(row).toHaveProperty('refundAmount');
              expect(row).toHaveProperty('couponTotal');
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================
// Property 7: 필수 컬럼 누락 시 오류 명시
// Feature: promo-performance-dashboard, Property 7: 필수 컬럼 누락 시 오류 명시
// Validates: Requirements 2.8
// ============================================================

describe('Property 7: 필수 컬럼 누락 시 오류 명시', () => {
  const allSalesCols = ['날짜', '요일', '결제금액', '환불금액', '쿠폰합계'] as const;
  const requiredSalesCols = ['날짜', '결제금액'] as const;

  it('판매성과 필수 컬럼 일부 제거 → MISSING_COLUMNS + missingColumns 포함', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 필수 컬럼 중 1개 이상 제거
        fc.subarray(requiredSalesCols as unknown as string[], { minLength: 1 }),
        async (removedRequired) => {
          const baseRow: Record<string, unknown> = {};
          for (const col of allSalesCols) {
            if (!removedRequired.includes(col)) {
              baseRow[col] = col === '날짜' ? '2026-03-01' : 0;
            }
          }
          const file = makeXlsxFile([baseRow]);
          const result = await parseSalesPerformance(file);
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.error.code).toBe('MISSING_COLUMNS');
            expect(result.error.missingColumns).toBeDefined();
            expect(result.error.missingColumns!.length).toBeGreaterThan(0);
            for (const col of removedRequired) {
              expect(result.error.missingColumns).toContain(col);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('상품성과 필수 컬럼 제거 → MISSING_COLUMNS', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.subarray(['상품ID', '결제금액'] as string[], { minLength: 1 }),
        async (removedRequired) => {
          const baseRow: Record<string, unknown> = {
            상품ID: 'P1',
            상품명: '상품',
            결제금액: 1000,
          };
          for (const col of removedRequired) {
            delete baseRow[col];
          }
          const file = makeXlsxFile([baseRow]);
          const result = await parseProductPerformance(file);
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.error.code).toBe('MISSING_COLUMNS');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================
// Property 8: 파싱 Round-Trip
// Feature: promo-performance-dashboard, Property 8: 파싱 Round-Trip
// Validates: Requirements 2.10
// ============================================================

describe('Property 8: 파싱 Round-Trip', () => {
  const arbitrarySalesRow = fc.record({
    날짜: fc.integer({ min: 1, max: 28 }).map((d) => `2026-03-${String(d).padStart(2, '0')}`),
    요일: fc.constantFrom('월', '화', '수', '목', '금', '토', '일'),
    결제금액: fc.integer({ min: 0, max: 1_000_000 }),
    환불금액: fc.integer({ min: 0, max: 100_000 }),
    쿠폰합계: fc.integer({ min: 0, max: 50_000 }),
  });

  it('임의 SalesRow 배열 → 파싱 → 동일 행 수 유지', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbitrarySalesRow, { minLength: 1, maxLength: 30 }),
        async (rows) => {
          const file = makeXlsxFile(rows);
          const result = await parseSalesPerformance(file);
          expect(result.ok).toBe(true);
          if (result.ok) {
            expect(result.data.rows.length).toBe(rows.length);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('파싱 후 결제금액 값 보존', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            날짜: fc.constant('2026-03-01'),
            요일: fc.constant('월'),
            결제금액: fc.integer({ min: 0, max: 999_999 }),
            환불금액: fc.constant(0),
            쿠폰합계: fc.constant(0),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (rows) => {
          const file = makeXlsxFile(rows);
          const result = await parseSalesPerformance(file);
          expect(result.ok).toBe(true);
          if (result.ok) {
            result.data.rows.forEach((r, i) => {
              expect(r.paymentAmount).toBe(rows[i].결제금액);
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================
// Property 9: 카테고리 매칭 정확성
// Feature: promo-performance-dashboard, Property 9: 카테고리 매칭 정확성
// Validates: Requirements 2.11
// ============================================================

describe('Property 9: 카테고리 매칭 정확성', () => {
  // 임의 상품ID 생성
  const arbitraryProductId = fc.string({ minLength: 1, maxLength: 8 }).filter(
    (s) => s.trim().length > 0
  );

  it('상품코드 ↔ 상품ID 일치 항목 → division/largeCat 정확히 매핑', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: arbitraryProductId,
            division: fc.string({ minLength: 1, maxLength: 5 }),
            largeCat: fc.string({ minLength: 1, maxLength: 5 }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (items) => {
          // 중복 ID 제거
          const unique = Array.from(
            new Map(items.map((i) => [i.id, i])).values()
          );

          const products: ProductPerformanceData = {
            rows: unique.map((item) => ({
              productId: item.id,
              productName: `name_${item.id}`,
              categoryLarge: '', categoryMedium: '', categorySmall: '',
              paymentCount: 1, paymentQty: 1, paymentAmount: 100,
              couponTotal: 0, productCoupon: 0, orderCoupon: 0,
              refundCount: 0, refundAmount: 0, refundQty: 0,
            })),
          };

          const category: CategoryData = {
            rows: unique.map((item) => ({
              productCode: item.id,
              division: item.division,
              largeCat: item.largeCat,
              mediumCat: 'M',
              smallCat: 'S',
              productName: `name_${item.id}`,
            })),
          };

          const merged = mergeWithCategory(products, category);

          for (const row of merged.rows) {
            const expected = unique.find((u) => u.id === row.productId);
            expect(row.isMatched).toBe(true);
            expect(row.division).toBe(expected!.division);
            expect(row.largeCat).toBe(expected!.largeCat);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('매칭 안 되는 상품 → isMatched=false, division/largeCat=미매칭', () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryProductId, { minLength: 1, maxLength: 10 }),
        (ids) => {
          const uniqueIds = [...new Set(ids)];
          const products: ProductPerformanceData = {
            rows: uniqueIds.map((id) => ({
              productId: id,
              productName: `name_${id}`,
              categoryLarge: '', categoryMedium: '', categorySmall: '',
              paymentCount: 1, paymentQty: 1, paymentAmount: 100,
              couponTotal: 0, productCoupon: 0, orderCoupon: 0,
              refundCount: 0, refundAmount: 0, refundQty: 0,
            })),
          };
          // 카테고리에는 전혀 다른 코드만 포함
          const category: CategoryData = {
            rows: [{ productCode: '__NOMATCH__', division: 'D', largeCat: 'L', mediumCat: 'M', smallCat: 'S', productName: 'N' }],
          };

          const merged = mergeWithCategory(products, category);
          for (const row of merged.rows) {
            expect(row.isMatched).toBe(false);
            expect(row.division).toBe('미매칭');
            expect(row.largeCat).toBe('미매칭');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
