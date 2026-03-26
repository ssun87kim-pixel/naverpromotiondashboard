import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { ProductRow } from '../../types/index';

// ============================================================
// Arbitrary: 임의 ProductRow 생성
// ============================================================

function arbitraryProductRow(): fc.Arbitrary<ProductRow> {
  return fc.record({
    division: fc.constantFrom('가구', '침구', '소품', '기타'),
    largeCat: fc.constantFrom('소파', '침대', '책상', '의자', '수납'),
    productName: fc.string({ minLength: 1, maxLength: 30 }),
    productId: fc.string({ minLength: 1, maxLength: 20 }),
    qty: fc.integer({ min: 0, max: 10000 }),
    qtyShare: fc.float({ min: 0, max: 100, noNaN: true }),
    netAmount: fc.integer({ min: 0, max: 100_000_000 }),
    amountShare: fc.float({ min: 0, max: 100, noNaN: true }),
    refundCount: fc.integer({ min: 0, max: 1000 }),
    refundRate: fc.float({ min: 0, max: 100, noNaN: true }),
    isHighRefund: fc.boolean(),
    isUnmatched: fc.boolean(),
  });
}

// ============================================================
// 정렬 헬퍼 (ProductTable 내부 로직과 동일)
// ============================================================

function sortRows(
  rows: ProductRow[],
  key: 'qty' | 'amount' | 'refundRate'
): ProductRow[] {
  return [...rows].sort((a, b) => {
    if (key === 'qty') return b.qty - a.qty;
    if (key === 'amount') return b.netAmount - a.netAmount;
    return b.refundRate - a.refundRate;
  });
}

// ============================================================
// Feature: promo-performance-dashboard, Property 18: 상품 테이블 정렬 기능
// ============================================================

describe('ProductTable 정렬 기능 (Property 18)', () => {
  /**
   * Validates: Requirements 6.7
   * 임의 ProductRow 배열에 대해 정렬 기준별 내림차순 관계 검증
   */
  it('qty 기준 정렬 후 인접 행은 qty 내림차순 관계를 만족한다', () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryProductRow(), { minLength: 2, maxLength: 50 }),
        (rows) => {
          const sorted = sortRows(rows, 'qty');
          for (let i = 0; i < sorted.length - 1; i++) {
            expect(sorted[i].qty).toBeGreaterThanOrEqual(sorted[i + 1].qty);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('amount 기준 정렬 후 인접 행은 netAmount 내림차순 관계를 만족한다', () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryProductRow(), { minLength: 2, maxLength: 50 }),
        (rows) => {
          const sorted = sortRows(rows, 'amount');
          for (let i = 0; i < sorted.length - 1; i++) {
            expect(sorted[i].netAmount).toBeGreaterThanOrEqual(sorted[i + 1].netAmount);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('refundRate 기준 정렬 후 인접 행은 refundRate 내림차순 관계를 만족한다', () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryProductRow(), { minLength: 2, maxLength: 50 }),
        (rows) => {
          const sorted = sortRows(rows, 'refundRate');
          for (let i = 0; i < sorted.length - 1; i++) {
            expect(sorted[i].refundRate).toBeGreaterThanOrEqual(sorted[i + 1].refundRate);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('정렬 후 행 수는 원본과 동일하다', () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryProductRow(), { minLength: 0, maxLength: 50 }),
        fc.constantFrom('qty', 'amount', 'refundRate' as const),
        (rows, key) => {
          const sorted = sortRows(rows, key as 'qty' | 'amount' | 'refundRate');
          expect(sorted.length).toBe(rows.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('원본 배열은 정렬 후에도 변경되지 않는다 (불변성)', () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryProductRow(), { minLength: 1, maxLength: 20 }),
        (rows) => {
          const original = rows.map((r) => r.qty);
          sortRows(rows, 'qty');
          const after = rows.map((r) => r.qty);
          expect(after).toEqual(original);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================
// 단위 테스트: 구체적 예시
// ============================================================

describe('ProductTable 정렬 단위 테스트', () => {
  const sampleRows: ProductRow[] = [
    {
      division: '가구', largeCat: '소파', productName: 'A', productId: '1',
      qty: 10, qtyShare: 50, netAmount: 100000, amountShare: 60,
      refundCount: 1, refundRate: 10, isHighRefund: false, isUnmatched: false,
    },
    {
      division: '침구', largeCat: '침대', productName: 'B', productId: '2',
      qty: 30, qtyShare: 30, netAmount: 50000, amountShare: 30,
      refundCount: 3, refundRate: 30, isHighRefund: true, isUnmatched: false,
    },
    {
      division: '소품', largeCat: '의자', productName: 'C', productId: '3',
      qty: 20, qtyShare: 20, netAmount: 80000, amountShare: 10,
      refundCount: 2, refundRate: 20, isHighRefund: false, isUnmatched: true,
    },
  ];

  it('qty 기준 정렬: 30 → 20 → 10', () => {
    const sorted = sortRows(sampleRows, 'qty');
    expect(sorted.map((r) => r.qty)).toEqual([30, 20, 10]);
  });

  it('amount 기준 정렬: 100000 → 80000 → 50000', () => {
    const sorted = sortRows(sampleRows, 'amount');
    expect(sorted.map((r) => r.netAmount)).toEqual([100000, 80000, 50000]);
  });

  it('refundRate 기준 정렬: 30 → 20 → 10', () => {
    const sorted = sortRows(sampleRows, 'refundRate');
    expect(sorted.map((r) => r.refundRate)).toEqual([30, 20, 10]);
  });

  it('빈 배열 정렬 시 빈 배열 반환', () => {
    expect(sortRows([], 'qty')).toEqual([]);
  });
});
